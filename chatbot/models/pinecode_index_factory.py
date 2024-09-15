import os

from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeEmbeddings, PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings

from pydantic_settings import BaseSettings


class PineconeSettings(BaseSettings):
    api_key: str = os.getenv("PINECONE_API_KEY")
    environment: str = "gcp-starter"


class EmbeddingSettings(BaseSettings):
    model_name: str
    dimension: int

    class Config:
        protected_namespaces = ("settings_",)


class OpenAIEmbeddingSettings(EmbeddingSettings):
    model_name: str = "text-embedding-3-small"
    dimension: int = 1536
    api_key: str = os.getenv("OPENAI_API_KEY")


class HuggingFaceEmbeddingSettings(EmbeddingSettings):
    model_name: str = "BAAI/bge-m3"
    dimension: int = 1024


class PineconeEmbeddingSettings(EmbeddingSettings):
    model_name: str = "multilingual-e5-large"
    dimension: int = 1024


class AppSettings(BaseSettings):
    pinecone_settings: PineconeSettings = PineconeSettings()
    openai_embedding_settings: OpenAIEmbeddingSettings = OpenAIEmbeddingSettings()
    huggingface_embedding_settings: HuggingFaceEmbeddingSettings = (
        HuggingFaceEmbeddingSettings()
    )
    pinecone_embedding_settings: PineconeEmbeddingSettings = PineconeEmbeddingSettings()


class PineconeIndexFactory:
    # model choices motivated by
    # https://towardsdatascience.com/openai-vs-open-source-multilingual-embedding-models-e5ccb7c90f05
    def __init__(self, index_name: str, embedding_provider: str = "openai"):
        self.index_name = index_name
        self.embedding_provider = embedding_provider
        self.settings = AppSettings()
        self.pc = Pinecone(api_key=self.settings.pinecone_settings.api_key)
        self.embeddings = self._get_embeddings()
        self.index = self._get_or_create_index()

    def get_model_name(self):
        return getattr(
            self.settings, f"{self.embedding_provider}_embedding_settings"
        ).model_name

    def _get_embeddings(self):
        if self.embedding_provider == "openai":
            return OpenAIEmbeddings(
                model=self.settings.openai_embedding_settings.model_name
            )
        elif self.embedding_provider == "huggingface":
            return HuggingFaceEmbeddings(
                model_name=self.settings.huggingface_embedding_settings.model_name
            )
        elif self.embedding_provider == "pinecone":
            return PineconeEmbeddings(
                model=self.settings.pinecone_embedding_settings.model_name
            )
        else:
            raise ValueError(f"Invalid embedding provider: {self.embedding_provider}")

    def _get_or_create_index(self):
        try:
            return self.pc.Index(self.index_name)
        except Exception:
            print(f"Index {self.index_name} does not exist. Creating...")
            self._create_index()
            return self.pc.Index(self.index_name)

    def _create_index(self):
        dimension = getattr(
            self.settings, f"{self.embedding_provider}_embedding_settings"
        ).dimension
        self.pc.create_index(
            name=self.index_name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

    def _self_embedder(self, inputs: list[str]):
        """embeddings from pinecone
        Args:
            inputs
        Returns:
            EmbeddingsList(
                model='multilingual-e5-large',
                data=[
                    {'values': [0.00832366943359375,....]},
                ],
                usage={'total_tokens': 4661}
            )
        """
        if self.embedding_provider == "pinecone":
            embeddings = self.pc.inference.embed(
                self.get_model_name, inputs=inputs, parameters={"input_type": "passage"}
            )
        if self.embedding_provider == "openai":
            pass
        else:
            raise NotImplementedError(
                "Not implemented agnostic operations for {self.embedding_provider}"
            )
        return embeddings

    def self_insert_documents(self, documents, namespace):
        embeddings = self.pinecone_embedder(
            [documents.page_content for documents in documents]
        )

        vectors = []
        for d, e in zip(documents, embeddings):
            vectors.append(
                {
                    "id": d.metadata["source"].split("/")[-1]
                    + "/"
                    + str(d.metadata.get("question_number", "unknown")),
                    "values": e["values"],
                    "metadata": {
                        "text": d.page_content,
                        "source": d.metadata["source"],
                        "question_number": d.metadata.get("question_number", 0),
                    },
                }
            )

        self.index.upsert(vectors=vectors, namespace=namespace)

    def self_query_pinecone(self, query: str, namespace):
        query_embeddings = self.pinecone_embedder([query])
        query_results = self.index.query(
            namespace=namespace,
            vector=query_embeddings[0]["values"],
            top_k=5,
            include_values=True,
            include_metadata=True,
        )
        return query_results

    def get_vector_store(self, namespace: str = ""):
        return PineconeVectorStore(
            index_name=self.index_name, embedding=self.embeddings, namespace=namespace
        )

    def insert_documents(self, documents, namespace: str = ""):
        vector_store = self.get_vector_store(namespace)
        vector_store.add_documents(documents)

    def similarity_search(self, query: str, k: int = 3, namespace: str = ""):
        vector_store = self.get_vector_store(namespace)
        return vector_store.similarity_search(query, k=k)


# Usage example
if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()

    # Create a Pinecone index with OpenAI embeddings
    pinecone_openai = PineconeIndexFactory(
        "traiteur-openai", embedding_provider="openai"
    )

    results_openai = pinecone_openai.similarity_search(
        "Quelle est la distance à laquelle vous livrez?", k=3, namespace="test"
    )
    results_openai

    query = "Livez vous à Angers?"

    # Compare results
    print("OpenAI Embeddings Results:")
    for doc in results_openai:
        print(f"Content: {doc.page_content[:100]}...")

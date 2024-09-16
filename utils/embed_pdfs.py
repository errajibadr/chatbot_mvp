import os
from dotenv import load_dotenv
from utils.pdf_parser import parse_pdf
from chatbot.models.pinecode_index_factory import PineconeIndexFactory

load_dotenv()


def embed_pdfs_to_pinecone(
    pdf_directory: str,
    index_name: str,
    namespace: str,
    embedding_provider: str = "openai",
):
    # Parse PDFs
    print(f"Parsing PDFs from {pdf_directory}")
    documents = parse_pdf(pdf_directory)

    # Create Pinecone index
    print(f"Creating Pinecone index: {index_name}")
    pinecone_index = PineconeIndexFactory(
        index_name, embedding_provider=embedding_provider
    )

    # Insert documents into Pinecone
    print(f"Inserting documents into Pinecone namespace: {namespace}")
    pinecone_index.insert_documents(documents, namespace=namespace)

    print("Embedding process completed successfully.")


def main():
    pdf_directory = (
        input("Enter the path to the PDF directory: ")
        or "/Users/badrou/repository/chatbot_mvp/chatbot/data"
    )
    index_name = input("Enter the Pinecone index name: ") or "faqs"
    namespace = input("Enter the namespace for the documents: ") or "Prestige-Webb"
    embedding_provider = (
        input(
            "Enter the embedding provider (openai/huggingface/pinecone, default: openai): "
        )
        or "openai"
    )

    embed_pdfs_to_pinecone(pdf_directory, index_name, namespace, embedding_provider)


if __name__ == "__main__":
    main()

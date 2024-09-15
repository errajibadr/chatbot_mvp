from pydantic import BaseModel
from langchain_core.tools import tool

from chatbot.models.pinecode_index_factory import PineconeIndexFactory


class FAQ_TOOL(BaseModel):
    question: str = (
        "Lookup the FAQ to get the answer all questions about the traiteur laHalle."
    )


@tool(args_schema=FAQ_TOOL)
def lookup_faq(question: str) -> str:
    """
    Lookup the FAQ to get the answer all questions about the traiteur laHalle.
    """
    pinecone_index = PineconeIndexFactory(index_name="traiteur-openai")
    return pinecone_index.similarity_search(question, namespace="test")

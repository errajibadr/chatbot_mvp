from pydantic import BaseModel
from langchain_core.tools import tool
from chatbot.models.pinecode_index_factory import PineconeIndexFactory
from chatbot.utils.utils import measure_time


class FAQ_TOOL(BaseModel):
    question: str = "Lookup the FAQ to get the answer all questions about a subject ."


@tool(args_schema=FAQ_TOOL)
@measure_time
def lookup_faq(question: str) -> str:
    """
    Lookup the FAQ to get the answer of all questions about PrestigeWebb agency.
    """
    pinecone_index = PineconeIndexFactory(index_name="faqs")
    return pinecone_index.similarity_search(question, namespace="Prestige-Webb")

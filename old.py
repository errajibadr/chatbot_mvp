from datetime import datetime
import logging
from dotenv import load_dotenv
from langchain_core.tools import tool
from ai_agent.infrastructure.pinecone_index_factory import PineconeIndexFactory
from langchain_core.runnables import RunnableConfig, Runnable
from pydantic import BaseModel

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableLambda
from langgraph.prebuilt import ToolNode


from typing_extensions import TypedDict
from typing import Annotated
from langgraph.graph.message import AnyMessage, add_messages


from langchain_core.prompts import ChatPromptTemplate


logger = logging.getLogger(__name__)

load_dotenv()


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


@tool
def fetch_user_flight_information(config: RunnableConfig) -> list[dict]:
    """Fetch all tickets for the user along with corresponding flight information and seat assignments.

    Returns:
        A list of dictionaries where each dictionary contains the ticket details,
        associated flight details, and the seat assignments for each ticket belonging to the user.
    """
    configuration = config.get("configurable", {})
    user_id = configuration.get("user_id", None)
    if not user_id:
        raise ValueError("No passenger ID configured.")
    return user_id


def handle_tool_error(state: dict) -> dict:
    error = state.get("error")
    tool_calls = state["messages"][-1].tool_calls
    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n please fix your mistakes.",
                tool_call_id=tc["id"],
            )
            for tc in tool_calls
        ]
    }


def create_tool_node_with_fallback(tools: list) -> dict:
    return ToolNode(tools).with_fallbacks(
        [RunnableLambda(handle_tool_error)], exception_key="error"
    )


def _print_event(event: dict, _printed: set, max_length=1500):
    current_state = event.get("dialog_state")
    if current_state:
        print("Currently in: ", current_state[-1])
    message = event.get("messages")
    if message:
        if isinstance(message, list):
            message = message[-1]
        if message.id not in _printed:
            msg_repr = message.pretty_repr(html=True)
            if len(msg_repr) > max_length:
                msg_repr = msg_repr[:max_length] + " ... (truncated)"
            print(msg_repr)
            _printed.add(message.id)


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


class Assistant:
    def __init__(self, runnable: Runnable):
        self.runnable = runnable

    def __call__(self, state: State, config: RunnableConfig):
        while True:
            configuration = config.get("configurable", {})
            user_id = configuration.get("user_id", None)
            state = {**state, "user_info": user_id}
            result = self.runnable.invoke(state)
            # If the LLM happens to return an empty response, we will re-prompt it
            # for an actual response.
            if not result.tool_calls and (
                not result.content
                or isinstance(result.content, list)
                and not result.content[0].get("text")
            ):
                messages = state["messages"] + [("user", "Respond with a real output.")]
                state = {**state, "messages": messages}
            else:
                break
        return {"messages": result}


if __name__ == "__main__":
    from langgraph.graph import Graph
    from langgraph.checkpoint.memory import MemorySaver
    from langgraph.graph import END, StateGraph, START
    from langgraph.prebuilt import tools_condition
    from langchain_openai import ChatOpenAI
    from langchain_groq import ChatGroq
    import instructor

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)
    # llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.0)

    primary_assistant_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Tu es un assistant intelligent pour support client qui peut répondre à des questions sur le traiteur laHalle. "
                " Utilise les outils que tu as à ta disposition pour répondre aux questions de l'utilisateur. "
                " Si tu recherches, sois persistant. pousse les limites de tes recherches si la première recherche ne retourne pas de résultat. "
                " Si une recherche ne retourne rien, expand tes recherches avant d'abandonner'."
                "\n\nUtilisateur actuel :\n<User>\n{user_info}\n</User>"
                "\nTemps actuel: {time}.",
            ),
            ("placeholder", "{messages}"),
        ]
    ).partial(time=datetime.now())

    tools = [lookup_faq]
    llm = llm.bind_tools(tools)

    v1_assistant = primary_assistant_prompt | llm

    builder = StateGraph(State)

    # Define nodes: these do the work
    builder.add_node("assistant", Assistant(v1_assistant))
    builder.add_node("tools", create_tool_node_with_fallback(tools))
    # Define edges: these determine how the control flow moves
    builder.add_edge(START, "assistant")
    builder.add_conditional_edges(
        "assistant",
        tools_condition,
    )
    builder.add_edge("tools", "assistant")

    # The checkpointer lets the graph persist its state
    # this is a complete memory for the entire graph.
    memory = MemorySaver()
    part_1_graph = builder.compile(checkpointer=memory)

    from IPython.display import Image, display

    try:
        display(Image(part_1_graph.get_graph(xray=True).draw_mermaid_png()))
    except Exception:
        # This requires some extra dependencies and is optional
        pass

    import uuid

    # Update with the backup file so we can restart from the original place in each section
    thread_id = str(uuid.uuid4())

    config = {
        "configurable": {
            # The user_id is used in our flight tools to
            # fetch the user's flight information
            "user_id": "3442 587242",
            # Checkpoints are accessed by thread_id
            "thread_id": thread_id,
        }
    }

    _printed = set()
    while True:
        question = input("Enter a question: ")
        if question == "exit":
            break
        events = part_1_graph.stream(
            {"messages": ("user", question)}, config, stream_mode="values"
        )
        for event in events:
            _print_event(event, _printed)

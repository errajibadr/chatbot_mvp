from datetime import datetime

import uuid

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable


from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import tools_condition
from langchain_core.tools import BaseTool

from chatbot.agent.assistant import Assistant
from chatbot.tools.tool_error_utils import create_tool_node_with_fallback
from chatbot.tools.rag_tools import lookup_faq
from chatbot.utils.utils import State, _print_event


class ChatbotGraph:
    @staticmethod
    def build(
        prompt: ChatPromptTemplate, llm_with_tools: Runnable, tools: list[BaseTool]
    ):
        builder = StateGraph(State)

        assistant = prompt | llm_with_tools
        # Define nodes: these do the work
        builder.add_node("prompt", prompt)
        builder.add_node("assistant", Assistant(assistant))
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
        return builder.compile(checkpointer=memory)


if __name__ == "__main__":
    from langchain_openai import ChatOpenAI

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

    thread_id = str(uuid.uuid4())

    config = {
        "configurable": {
            "user_id": "3442 587242",
            # Checkpoints are accessed by thread_id
            "thread_id": thread_id,
        }
    }

    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
    )
    tools = [lookup_faq]
    llm_with_tools = llm.bind_tools(tools)

    assistant = primary_assistant_prompt | llm_with_tools

    graph = ChatbotGraph.build(assistant, tools)

    _printed = set()
    while True:
        question = input("Enter a question: ")
        if question == "exit":
            break
        events = graph.stream(
            {"messages": ("user", question)}, config, stream_mode="values"
        )
        for event in events:
            print(event)
            _print_event(event, _printed)

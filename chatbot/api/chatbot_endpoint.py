from chatbot.tools.rag_tools import lookup_faq
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn

from chatbot.graphs.graph import ChatbotGraph

# Load .env file
load_dotenv()


app = FastAPI(
    title="LangServe AI Agent",
    version="1.0",
    description="LangGraph backend for the AI Agents Masterclass series agent.",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def main():
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    import uuid
    from datetime import datetime

    primary_assistant_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Tu es un assistant intelligent pour support client qui peut répondre à des questions sur l'agence PrestigeWebb. "
                " Utilise les outils que tu as à ta disposition pour répondre aux questions de l'utilisateur. "
                "Reste concis dans tes réponses"
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

    # assistant = primary_assistant_prompt | llm_with_tools
    # Fetch the AI Agent LangGraph runnable which generates the workouts

    runnable = ChatbotGraph.build(primary_assistant_prompt, llm_with_tools, tools)

    # Create the Fast API route to invoke the runnable
    add_routes(app, runnable, path="/chatbot/prestige-webb")

    # Start the API
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()

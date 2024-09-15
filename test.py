import asyncio
import json
from dotenv import load_dotenv
from datetime import datetime

import uuid
import os

from langchain_core.messages import SystemMessage, AIMessage, HumanMessage, ToolMessage
from langserve import RemoteRunnable

load_dotenv()
agent_endpoint_url = os.getenv("AGENT_ENDPOINT_URL", "http://localhost:8000")


def create_chatbot_instance():
    return RemoteRunnable(agent_endpoint_url)


chatbot = create_chatbot_instance()


def get_thread_id():
    return str(uuid.uuid4())


thread_id = get_thread_id()

system_message = f"""
You are a helpful assistant.
The current date is: {datetime.now().date()}
"""


async def prompt_ai(messages):
    config = {"configurable": {"thread_id": thread_id}}

    async for event in chatbot.astream_events(
        {"messages": messages}, config, version="v1"
    ):
        if event["event"] == "on_chat_model_stream":
            yield event["data"]["chunk"].content


async def main():
    message = HumanMessage(content="Hello, how are you?")
    message_json = json.loads(message.json())
    print(message_json)
    async for event in prompt_ai([HumanMessage(content="Hello, how are you?")]):
        print(event)


if __name__ == "__main__":
    asyncio.run(main())

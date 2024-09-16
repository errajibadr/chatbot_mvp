# Stage 1: Use the chatbot_env as a builder
FROM chatbot_env:latest AS builder

# Stage 2: Create the final image
FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN useradd -m appuser

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/venv /app/venv

# Set the correct PATH
ENV PATH="/app/chatbot:/app/venv/bin:$PATH"

# Now we can use pip to upgrade sse_starlette
RUN pip install --upgrade sse_starlette

# Copy the chatbot directory to /app/chatbot/
COPY ./chatbot/ /app/chatbot/

# Copy the .env file
COPY .env .

# Change ownership of the app directory to appuser
USER root
RUN chown -R appuser:appuser /app
USER appuser

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run the application when the container launches
CMD ["python", "chatbot/api/chatbot_endpoint.py"]
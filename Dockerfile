# Stage 1: Builder
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements first for better cache utilization
COPY ./chatbot/chatbot_requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r chatbot_requirements.txt && \
    rm -rf /root/.cache/pip chatbot_requirements.txt

# Stage 2: Final
FROM python:3.11-slim AS final

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH="/app/:/app/chatbot/"
ENV PATH="/opt/venv/bin:$PATH"

# Create a non-root user
RUN useradd -m appuser

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application files
COPY --chown=appuser:appuser ./chatbot/ /app/chatbot/
# COPY --chown=appuser:appuser .env .

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["python", "chatbot/api/chatbot_endpoint.py"]
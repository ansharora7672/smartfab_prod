FROM python:3.12-slim

WORKDIR /app

# System deps needed by Playwright (headless Chromium) and PDF libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-caches unless requirements change)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright's Chromium browser and its OS dependencies
RUN playwright install chromium --with-deps

# Copy application source
COPY backend/app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

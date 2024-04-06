FROM python:3.10.14-alpine
EXPOSE 7777/tcp
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "./server.py", "--port", "7777", "--cred_path", "./google-credentials.json"]

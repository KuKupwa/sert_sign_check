server собирается через Docker 
docker build -t pkcs_server <путь к папке>
docker run -p 8000:8000 -it pkcs_server 

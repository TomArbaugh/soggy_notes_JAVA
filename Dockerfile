FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy source files and audio samples
COPY src/ ./src/
COPY Samples/ ./Samples/

# Compile server files (excludes JUnit tests and JavaFX Main that have external dependencies)
RUN mkdir -p out && javac -d out \
    src/ScaleServer.java \
    src/Scale.java \
    src/Key.java \
    src/AbstractKey.java \
    src/Harmony.java \
    src/Guess.java \
    src/Quality.java \
    src/Constants.java \
    src/NoteList.java \
    src/GenLL.java \
    src/Node.java \
    src/EmptyNode.java \
    src/iNode.java \
    src/iPlay.java \
    src/Controller.java \
    src/View.java

# Expose the port (Render will set PORT env var)
EXPOSE 8080

# Run the server
CMD ["java", "-cp", "out", "ScaleServer"]

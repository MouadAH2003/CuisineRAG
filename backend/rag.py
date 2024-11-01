import os
from qdrant_client import QdrantClient
from langchain_community.embeddings import HuggingFaceEmbeddings
from llama_index.embeddings.langchain import LangchainEmbedding

from llama_index.llms.groq import Groq
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.core.storage.storage_context import StorageContext

from llama_index.core import Settings

import warnings
warnings.filterwarnings("ignore")

class Assistant:
    def __init__(self):
        self._qdrant_url = "http://localhost:6333"
        self._client = QdrantClient(url=self._qdrant_url)
        self._collection_name="kitchen_db"

        # Load Sentence Transformer for embeddings
        self._embed_model = LangchainEmbedding(
            HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
        )

        # Initialize Groq LLM
        self._llm = Groq(model="llama3-70b-8192", api_key="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")

        Settings.llm = self._llm
        Settings.embed_model = self._embed_model
        self._index = None

        # Create knowledge base and chat engine
        self._create_kb()
        self._create_chat_engine()

    def _create_kb(self):
        try:
            if self._client.collection_exists(collection_name=f"{self._collection_name}"):
                print("Knowledge base already exists. Loading existing index.")
                vector_store = QdrantVectorStore(
                    client=self._client, collection_name="kitchen_db"
                )
                storage_context = StorageContext.from_defaults(vector_store=vector_store)
                self._index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
                
                return

            all_documents = []

            # Iterate through all .txt files in the "data" directory
            data_folder = "data"
            for filename in os.listdir(data_folder):
                if filename.endswith(".txt"):
                    filepath = os.path.join(data_folder, filename)

                    # Load the data from each text file using SimpleDirectoryReader
                    docs = SimpleDirectoryReader(input_files=[filepath]).load_data()
                    all_documents.extend(docs)  # Add the loaded documents to the list

            # Verify that documents are loaded correctly
            print(f"Loaded {len(all_documents)} documents.")
            # Create vector store with Qdrant
            vector_store = QdrantVectorStore(
                client=self._client, collection_name="kitchen_db"
            )
            storage_context = StorageContext.from_defaults(vector_store=vector_store)

            # Build index with documents
            self._index = VectorStoreIndex.from_documents(
                all_documents, storage_context=storage_context
            )
            print("Knowledge base created successfully!")

        except Exception as e:
            print(f"Error while creating knowledge base: {e}")

    def _create_chat_engine(self):
        if self._index is None:
            raise ValueError("Knowledge base index is not initialized.")

        memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
        self._chat_engine = self._index.as_chat_engine(
            chat_mode="context",
            memory=memory,
            system_prompt=self._prompt,
        )

    def interact_with_llm(self, customer_query):
        if self._chat_engine is None:
            raise ValueError("Chat engine is not initialized.")

        response = self._chat_engine.chat(customer_query)
        return response.response

    @property
    def _prompt(self):
        return """
            You are a Moroccan cuisine expert AI Assistant.
            Provide personalized recipe recommendations based on user preferences.
            Guide users step-by-step through the preparation process.
            Only provide recipes that are part of our context and only the moroccan recipes.
            If a recipe is not available , say you don't have information on that dish without guessing.
        """

    

# Example usage
if __name__ == "__main__":
    assistant = Assistant()
    print(assistant.interact_with_llm("hello"))

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("Assistant: Goodbye! Enjoy your meal!")
            break

        response = assistant.interact_with_llm(user_input)
        print(f"Assistant: {response}")
import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

from dotenv import load_dotenv
from tavily import TavilyClient
from qdrant_client import QdrantClient
from langchain_community.embeddings import HuggingFaceEmbeddings
from llama_index.embeddings.langchain import LangchainEmbedding
from llama_index.llms.groq import Groq
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.core.storage.storage_context import StorageContext
from llama_index.core import VectorStoreIndex, Document
from llama_index.core import Settings

import warnings
warnings.filterwarnings("ignore")

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EnhancedAssistant:
    def __init__(self, llm_params: Optional[Dict] = None):
        self._initialize_clients()
        self._initialize_embedding_model()
        self._initialize_llm(llm_params)
        self._create_kb()
        self._create_chat_engine()
        self._memory = []
        self.use_real_time_search = False

    def _initialize_clients(self):
        try:
            self._qdrant_url = os.getenv("QDRANT_URL")
            self._qdrant_api_key = os.getenv("QDRANT_API_KEY")
            self._client = QdrantClient(url=self._qdrant_url, api_key=self._qdrant_api_key)
            self._collection_name = "kitchen_db"
            self._tavily_api_key = os.getenv("TAVILY_API_KEY")
            self._tavily_client = TavilyClient(api_key=self._tavily_api_key)
            logger.info("Clients initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing clients: {e}")
            raise

    def _initialize_embedding_model(self):
        try:
            self._embed_model = LangchainEmbedding(
                HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
            )
            logger.info("Embedding model initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing embedding model: {e}")
            raise

    def _initialize_llm(self, llm_params: Optional[Dict]):
        try:
            default_llm_params = {
                "model": "llama-3.1-70b-versatile",
                "api_key": os.getenv("GROQ_API_KEY"),
                "temperature": 0.6,
                "max_tokens": 1024,
                "top_p": 0.8,
                "top_k": 11,
                "frequency_penalty": 0.2,
                "presence_penalty": 0.2
            }
            llm_params = {**default_llm_params, **(llm_params or {})}
            self._llm = Groq(**llm_params)
            Settings.llm = self._llm
            Settings.embed_model = self._embed_model
            logger.info("LLM initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            raise

    async def search_real_time(self, query: str) -> List[Dict]:
        try:
            search_params = {
                "query": query + " - Morocco",
                "search_depth": "advanced",
                "max_results": 5,
                "include_domains": ["cooking.com", "food.com", "allrecipes.com", "epicurious.com"],
                "exclude_domains": ["wikipedia.org"]
            }
            results = self._tavily_client.search(**search_params)
            return results.get('results', [])
        except Exception as e:
            logger.error(f"Error in real-time search: {e}")
            return []

    def _format_search_results(self, results: List[Dict]) -> str:
        return "\n".join([
            f"Title: {result.get('title', 'Unknown Title')}\n{result.get('content', '')}\n"
            for result in results
        ])

    def _create_kb(self):
        try:
            if self._client.collection_exists(collection_name=self._collection_name):
                logger.info("Loading existing knowledge base...")
                vector_store = QdrantVectorStore(
                    client=self._client,
                    collection_name=self._collection_name
                )
                storage_context = StorageContext.from_defaults(vector_store=vector_store)
                self._index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
                collection_info = self._client.get_collection(self._collection_name)
                logger.info(f"KB loaded. Points count: {collection_info.points_count}")
            else:
                raise ValueError("Collection not found in Qdrant")
        except Exception as e:
            logger.error(f"Error in KB initialization: {e}")
            raise

    def _create_chat_engine(self):
        if self._index is None:
            raise ValueError("Knowledge base index not initialized")
        memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
        self._chat_engine = self._index.as_chat_engine(
            chat_mode="context",
            memory=memory,
            system_prompt=self._get_system_prompt()
        )

    def _get_system_prompt(self) -> str:
        return """
        You are a highly knowledgeable AI Assistant specializing in Moroccan cuisine and general cooking.
        Your role is to provide detailed, authentic recipe recommendations and cooking advice.

        When using real-time information:
        1. Ensure accuracy and relevance
        2. Credit sources when appropriate
        3. Be clear about any modifications or adaptations
        4. Maintain focus on culinary advice and recipes

        Always maintain a helpful, friendly tone and prioritize user safety in cooking instructions.
        """

    async def chat(self, user_input: str) -> str:
        try:
            if self.use_real_time_search:
                search_results = await self.search_real_time(user_input)
                if not search_results:
                    return "I couldn't find relevant information online. Please try rephrasing your question."
                context = self._format_search_results(search_results)
                temp_doc = Document(text=context)
                temp_index = VectorStoreIndex.from_documents([temp_doc])
                temp_engine = temp_index.as_chat_engine(
                    chat_mode="context",
                    system_prompt=self._get_system_prompt()
                )
                response = temp_engine.chat(user_input)

                # Add sources to the response
                sources = "\n\nSources:\n" + "\n".join([
                    f"{result.get('title', 'Unknown Title')}: {result.get('url', 'No URL')}"
                    for result in search_results
                ])
                return f"{response.response}\n\n {sources}"
            else:
                response = self._chat_engine.chat(user_input)
                return response.response
        except Exception as e:
            logger.error(f"Error in chat processing: {e}")
            return "I apologize, but I encountered an error while processing your request. Please try again."

if __name__ == "__main__":
    import asyncio

    async def main():
        assistant = EnhancedAssistant()
        print("Welcome to the Enhanced Culinary Assistant!")
        print("Type 'toggle' to switch between knowledge base and real-time search.")
        print("Type 'quit' or 'bye' to exit.")

        while True:
            user_input = input("\nYou: ").strip()
            if user_input.lower() in {"quit", "bye", "exit"}:
                print("Goodbye! Have a great day!")
                break
            elif user_input.lower() == "toggle":
                assistant.use_real_time_search = not assistant.use_real_time_search
                mode = "real-time search" if assistant.use_real_time_search else "knowledge base"
                print(f"Mode switched to {mode}.")
            else:
                response = await assistant.chat(user_input)
                print(f"Assistant: {response}")

    asyncio.run(main())

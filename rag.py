# -*- coding: utf-8 -*-
"""rag.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/1tDrf9BIJvscbArUQ2S94LqTt534_N7wD
"""

import os
import json
import docx
from tika import parser
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

class FileExtractor:
    def __init__(self, file_path):
        self.file_path = file_path
        self.file_extension = os.path.splitext(file_path)[1].lower()

    def extract_text(self):
        if self.file_extension == '.pdf':
            return self._extract_pdf_text()
        elif self.file_extension == '.docx':
            return self._extract_docx_text()
        elif self.file_extension == '.json':
            return self._extract_json_text()
        else:
            return self._extract_generic_text()

    def _extract_pdf_text(self):
        reader = PdfReader(self.file_path)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
        return text

    def _extract_docx_text(self):
        doc = docx.Document(self.file_path)
        text = '\n'.join([para.text for para in doc.paragraphs])
        return text

    def _extract_json_text(self):
        with open(self.file_path, 'r') as file:
            data = json.load(file)
            return json.dumps(data, indent=4)

    def _extract_generic_text(self):
        parsed = parser.from_file(self.file_path)
        return parsed['content']

class RecipeExtractor:
    def __init__(self, directory):
        self.directory = directory
        self.recipes_dict = {}

    def extract_recipes(self):
        for filename in os.listdir(self.directory):
            if filename.endswith(".txt"):
                file_path = os.path.join(self.directory, filename)
                extractor = FileExtractor(file_path)
                text = extractor.extract_text()
                self.recipes_dict[os.path.splitext(filename)[0]] = text
        return self.recipes_dict

    def display_first_elements(self, number=5):
        for i, (key, value) in enumerate(self.recipes_dict.items()):
            if i >= number:
                break
            print(f"{key}: {value[:100]}...")
            print('-' * 50)

class Embedder:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def embed_chunks(self, dictionary):
        embeddings = []
        for text in dictionary.values():
            embedding = self.model.encode(text)
            embeddings.append(embedding)
        return embeddings

# Exemple d'utilisation
directory_path = 'recipes/'
recipe_extractor = RecipeExtractor(directory_path)
recipes = recipe_extractor.extract_recipes()
recipe_extractor.display_first_elements(5)

embedder = Embedder()
embedded_recipes = embedder.embed_chunks(recipes)
print(embedded_recipes[:5])
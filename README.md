```markdown
# MoroccanCulinAIry: Smart Moroccan Cuisine Chatbot with Real-Time RAG and Dietary Adaptability

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Evaluation](#evaluation)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

**MoroccanCulinAIry** is an AI-driven chatbot designed to offer personalized Moroccan cuisine recipes. It dynamically retrieves recipes from real-time sources using the Brave Search API or from a curated database of authentic Moroccan dishes. Powered by **Llama 3.1** and **Retrieval-Augmented Generation (RAG)**, the chatbot adapts these recipes based on user dietary preferences, including vegan, gluten-free, low-fat, and other health-related queries.

This project blends the rich tradition of Moroccan cuisine with modern AI technology to create a tool that serves both food enthusiasts and those with specific dietary needs. 

## Key Features

1. **Real-Time Recipe Retrieval:**
   - Retrieves authentic Moroccan recipes from the web using the Brave Search API.
   - Uses a fallback curated database of pre-scraped Moroccan recipes for offline access.

2. **Retrieval-Augmented Generation (RAG):**
   - Combines recipe retrieval with Llama 3.1's generation capabilities to modify recipes in real-time.
   - Ensures that the chatbot can dynamically suggest ingredient substitutions or recipe modifications based on dietary needs.

3. **Dietary and Health Adaptability:**
   - Customizes traditional Moroccan recipes to fit dietary restrictions such as vegan, gluten-free, low-sugar, and low-fat diets.
   - Suggests healthier alternatives without compromising the authenticity and flavor of the dish.

4. **Natural Language Interaction:**
   - Intuitive and user-friendly chatbot interface, allowing users to ask for recipe suggestions in natural language.
   - Handles complex queries like "Give me a healthier lamb tagine with fewer calories" or "Suggest a gluten-free Moroccan dessert."

## Technical Architecture

- **Llama 3.1:** The generative AI model that generates personalized recipe responses, including dietary adaptations.
- **Retrieval-Augmented Generation (RAG):** Combines real-time recipe retrieval with AI generation to handle complex user requests.
- **Brave Search API:** Used for fetching real-time recipes and data from the web.
- **Curated Recipe Database:** A backup database of Moroccan recipes in case API access is unavailable.
- **Knowledge Base:** Includes common ingredient substitutions (e.g., quinoa for couscous, coconut oil for butter) to enhance recipe modifications.

## Installation

### Prerequisites

- Python 3.8+
- `pip` for Python package management
- API key for **Brave Search** (if using real-time data retrieval)

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/MoroccanCulinAIry.git
   cd MoroccanCulinAIry
   ```

2. **Create a Virtual Environment (Optional but recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate   # On Windows use `venv\Scripts\activate`
   ```

3. **Install the Required Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Brave Search API key:
   ```bash
   BRAVE_API_KEY=your_brave_search_api_key
   ```

5. **Run the Application:**
   ```bash
   python app.py
   ```

## Usage

After running the application, interact with the chatbot via the command line or integrated web interface. Here are some example queries you can try:

- **"Give me a gluten-free Moroccan tagine recipe."**
- **"Suggest a healthier version of pastilla with fewer calories."**
- **"Provide a vegan alternative to traditional Moroccan couscous."**

The chatbot will respond with a personalized recipe, including real-time adaptations based on your dietary preferences.

## API Integration

### Brave Search API

This project utilizes the Brave Search API for real-time recipe retrieval. You will need to sign up for an API key at [Brave Search API](https://search.brave.com/) and configure it in the `.env` file.

If the API is unavailable or you prefer using a static dataset, the chatbot will automatically switch to the curated Moroccan recipe database for retrieving recipes.

### Retrieval-Augmented Generation (RAG)

RAG is used to combine the real-time retrieval of Moroccan recipes with the generative power of **Llama 3.1**, allowing the system to handle complex user queries. For example, when a user requests a vegan alternative to a traditional dish, RAG fetches relevant recipes and Llama 3.1 generates suitable substitutions and modifications.

## Evaluation

The chatbot is evaluated based on the following metrics:

- **Relevance and Authenticity:** Ensuring the retrieved recipes are both culturally accurate and authentic to Moroccan cuisine.
- **Dietary Adaptability:** The system's ability to modify traditional recipes to fit dietary restrictions (e.g., vegan, gluten-free) while retaining core Moroccan flavors.
- **Performance:** The responsiveness of the chatbot in both retrieval and generation, ensuring a smooth user experience.

## Future Enhancements

1. **Expanded Recipe Database:**
   - Add more Moroccan recipes to the curated database for offline access.

2. **Multilingual Support:**
   - Enable the chatbot to interact in multiple languages, such as Arabic and French, in addition to English.

3. **Nutritional Analysis:**
   - Integrate a nutritional analysis feature to provide users with detailed health information about the recipes (e.g., calorie count, macronutrient breakdown).

4. **Mobile App Integration:**
   - Develop a mobile-friendly version of the chatbot for easy access on smartphones.

## Contributing

We welcome contributions to improve the project! To contribute:

1. Fork the repository.
2. Create a feature branch.
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes.
   ```bash
   git commit -m "message "
   ```
4. Push to the branch.
   ```bash
   git push origin feature/your-feature
   ```
5. Create a Pull Request.

Please ensure that your contributions are aligned with the overall goal of enhancing Moroccan cuisine and dietary adaptability.

## License

This project is licensed under the ... License. See the [LICENSE](LICENSE) file for more details.

---

**Enjoy exploring authentic Moroccan cuisine with CuisineRAG!** If you encounter any issues or have suggestions, feel free to open an issue on GitHub.

## Contributors
1. **AIT HA Mouad** 
2. **LAMRANI Abdelaali**
3. **LAKHLOUFI Ismail**
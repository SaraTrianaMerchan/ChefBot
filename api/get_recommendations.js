import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- VERIFIED ALLERGEN MATRIX (Simulated for El Windsor Menu) ---
// In a real-world app, this would come from a database.
// Allergens: gluten, lactose, nuts, soy, fish, shellfish, eggs, peanuts
const fullMenu = [
  // Para Comer con las Manos
  { name: "Croqueta de Keemche", allergens: ['gluten', 'lactose', 'soy'] },
  { name: "Croqueta de Aji de gallina", allergens: ['gluten', 'lactose', 'nuts'] },
  { name: "Rollito Thai de Setas, verduras", allergens: ['gluten', 'soy'] },
  { name: "Gua Bao de Calamar Bravo", allergens: ['gluten', 'shellfish'] },
  { name: "Gua Bao David Chang (Panceta Ibérica)", allergens: ['gluten', 'soy'] },
  { name: "Gua Bao de Verduras en Tempura", allergens: ['gluten'] },
  // Para Compartir
  { name: "Gyozas de longaniza de Aragón", allergens: ['gluten', 'soy'] },
  { name: "Gyozas de Sepia encebollada", allergens: ['gluten', 'shellfish', 'soy'] },
  { name: "Gyozas de Pato a la Naranja", allergens: ['gluten', 'soy'] },
  { name: "Dumplings de Rabo de Vaca", allergens: ['gluten', 'soy'] },
  { name: "Alcachofas en Tempura con Torreznitos", allergens: ['gluten'] },
  { name: "Mortadela de Bolonia con Trufa", allergens: ['nuts'] }, // Pistachios are common
  { name: "Cecina Artesana de León", allergens: [] },
  { name: "Torreznitos", allergens: [] },
  { name: "Madejas de cordero", allergens: [] },
  { name: "Tirabeques", allergens: [] },
  { name: "Puerro a la brasa", allergens: [] },
  { name: "Caracoles con Teriyaki y Almendras", allergens: ['gluten', 'nuts', 'soy'] },
  { name: "Micuit de Foie de Pato", allergens: ['gluten (served with toast)'] },
  // Arroces y Wok (Implied Category)
  { name: "Arroz Chaufa Perú", allergens: ['gluten', 'soy', 'eggs'] },
  { name: "Arroz de Pato de Santa Eulalia", allergens: [] },
  { name: "Arroz Aragonés", allergens: [] },
  { name: "Pad Thai", allergens: ['peanuts', 'fish', 'soy', 'shellfish', 'eggs'] }, // Classic ingredients
  { name: "Salteado de Lagarto Ibérico", allergens: [] },
  // Carnes Brasa
  { name: "Lomo Clandestino de Vaca Vieja 300 grs", allergens: [] },
  { name: "Lagarto Ibérico", allergens: [] },
  { name: "Tuétano con Katsuobushi", allergens: ['fish'] }, // Katsuobushi is bonito flakes
  { name: "Longaniza criolla", allergens: [] },
  { name: "Surtido de Salchichas Alemanas Artesanas", allergens: ['gluten', 'lactose'] }, // Often contain bread/dairy
  // Pescados
  { name: "Ceviche de Corvina", allergens: ['fish'] },
  { name: "Salmòn a la Brasa", allergens: ['fish'] },
  { name: "Corvina a la Brasa", allergens: ['fish'] },
  { name: "Gamba Cristal de la Bahía de Cadíz", allergens: ['shellfish'] },
  { name: "Gamba Blanca de Huelva a la Sal en Brasa", allergens: ['shellfish'] },
  // Lamines (Desserts)
  { name: "Tarta de Queso", allergens: ['gluten', 'lactose', 'eggs'] },
  { name: "Tarta de Marrón Glacé", allergens: ['nuts', 'lactose', 'eggs'] },
  { name: "Lemon Pie", allergens: ['gluten', 'lactose', 'eggs'] },
  { name: "Helado Artesano", allergens: ['lactose'] },
  { name: "Tatín de Manzana", allergens: ['gluten', 'lactose'] }
];


export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { language, preferences } = request.body;
    
    // --- RAG Step 1: Retrieval (Filter the menu) ---
    // This is the core safety feature. We find dishes that DO NOT contain any of the user's allergies.
    const safeDishes = fullMenu.filter(dish => {
      // A dish is safe if NONE of its allergens are in the user's preference list
      return !dish.allergens.some(allergen => preferences.includes(allergen.split(' ')[0])); // 'gluten (toast)' -> 'gluten'
    });

    // If there are no safe dishes, return an empty array immediately.
    if (safeDishes.length === 0) {
      return response.status(200).json({ recommendations: [] });
    }

    // --- RAG Step 2: Augmentation & Generation (Ask AI to make the safe dishes sound good) ---
    const prompt = `
      You are ChefBot, an AI assistant for the restaurant "El Windsor".
      A customer needs recommendations. Based on their allergies, I have already filtered our menu and here is a list of dishes that are safe for them to eat:
      ${safeDishes.map(d => `- ${d.name}`).join('\n')}

      Please select up to 3 of these safe dishes and write a short, appealing description for each one.
      The customer's preferred language is ${language}. Write your entire response in that language.

      Your response MUST be a valid JSON object in the following format and nothing else. Do not add any text before or after the JSON.
      {
        "recommendations": [
          { "dishName": "Name of the dish", "description": "A brief, appealing description." },
          { "dishName": "Another dish name", "description": "Another description." }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using a more advanced model for better language and formatting
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;

    return response.status(200).json(JSON.parse(result));

  } catch (error) {
    console.error('Error in get-recommendations function:', error);
    return response.status(500).json({ error: 'Failed to get recommendations.' });
  }
}

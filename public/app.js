document.addEventListener('DOMContentLoaded', () => {
    // Find the form and the results container in the HTML
    const recommendationForm = document.querySelector('#chefbot-form form');
    const resultsContainer = document.createElement('div'); // We'll add results here
    resultsContainer.id = 'results-container';
    recommendationForm.after(resultsContainer); // Place the container right after the form

    // Listen for the form submission event
    recommendationForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Stop the browser from reloading the page

        // 1. Gather User Input
        const selectedLanguage = document.getElementById('language').value;
        const checkedAllergies = document.querySelectorAll('input[name="allergy"]:checked');
        
        const allergies = Array.from(checkedAllergies).map(checkbox => checkbox.value);

        const userData = {
            language: selectedLanguage,
            preferences: allergies
        };

        console.log('Sending data to backend:', userData);

        // 2. Show a loading state to the user
        resultsContainer.innerHTML = `
            <div class="text-center mt-8">
                <p class="text-lg text-blue-600">👨‍🍳 Finding safe and delicious options for you...</p>
            </div>
        `;

        try {
            // 3. Send the data to your secure backend endpoint (this is a placeholder URL)
            // We will build this backend in the next step.
            const response = await fetch('/api/get-recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                throw new Error(`Server responded with an error: ${response.status}`);
            }

            const recommendations = await response.json();

            // 4. Display the results
            displayRecommendations(recommendations);

        } catch (error) {
            console.error('Error fetching recommendations:', error);
            resultsContainer.innerHTML = `
                <div class="text-center mt-8 p-4 bg-red-100 text-red-700 rounded-lg">
                    <p>Sorry, something went wrong. Please try again or ask a member of staff for help.</p>
                </div>
            `;
        }
    });

    function displayRecommendations(data) {
        // Clear loading message
        resultsContainer.innerHTML = ''; 

        if (!data.recommendations || data.recommendations.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center mt-8 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                    <p>No specific dishes match all your criteria. For your safety, please confirm with our staff for personalized recommendations.</p>
                </div>
            `;
            return;
        }

        // Create the results HTML
        const resultsHtml = `
            <div class="mt-12">
                <h3 class="text-2xl font-semibold text-gray-800 mb-4">Your Safe Recommendations</h3>
                <ul class="space-y-4">
                    ${data.recommendations.map(item => `
                        <li class="bg-white p-4 rounded-lg shadow">
                            <h4 class="font-bold text-lg text-gray-900">${item.dishName}</h4>
                            <p class="text-gray-600">${item.description}</p>
                        </li>
                    `).join('')}
                </ul>
                <p class="text-sm text-gray-500 mt-6">
                    <strong>Important:</strong> While ChefBot provides recommendations based on our allergen matrix, please always inform your server of your allergies as a final precaution.
                </p>
            </div>
        `;
        
        resultsContainer.innerHTML = resultsHtml;
    }
});

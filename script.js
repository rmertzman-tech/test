document.addEventListener('DOMContentLoaded', () => {
    
    const app = {
        apiKey: '',
        
        // Load data from the global appData object defined in data.js
        navigators: appData.navigators,
        thinkers: appData.thinkers,
        concepts: appData.concepts,

        init() {
            this.loadApiKey();
            this.renderNavigators();
            this.renderThinkers();
            this.renderConcepts();
            this.renderComparisonLab();
            this.setupEventListeners();
            
            // Load saved user reflection from local storage
            const savedResonance = localStorage.getItem('resonanceInput');
            if (savedResonance) {
                document.getElementById('resonance-input').value = savedResonance;
            }
        },

        loadApiKey() {
            const savedKey = localStorage.getItem('geminiApiKey');
            if (savedKey) {
                this.apiKey = savedKey;
            }
        },
        
        renderNavigators() {
            const grid = document.getElementById('profile-grid');
            grid.innerHTML = this.navigators.map((profile, index) => `
                <div class="profile-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col" data-type="navigator" data-index="${index}">
                    <h3 class="text-xl font-bold text-indigo-700">${profile.name}</h3>
                    <p class="text-sm text-gray-500 mb-2">${profile.lifespan}</p>
                    <p class="font-semibold text-gray-800">${profile.title}</p>
                    <p class="text-gray-600 mt-2 text-sm flex-grow">${profile.summary}</p>
                </div>
            `).join('');
        },

        renderThinkers() {
            const grid = document.getElementById('thinker-grid');
            grid.innerHTML = this.thinkers.map((thinker, index) => `
                 <div class="thinker-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col" data-type="thinker" data-index="${index}">
                     <h3 class="text-xl font-bold text-teal-700">${thinker.name}</h3>
                     <p class="text-sm text-gray-500 mb-2">${thinker.lifespan}</p>
                     <p class="font-semibold text-gray-800">${thinker.title}</p>
                     <p class="text-gray-600 mt-2 text-sm flex-grow">${thinker.summary}</p>
                 </div>
            `).join('');
        },

        renderConcepts() {
            const container = document.getElementById('concept-grid');
            container.innerHTML = this.concepts.map((concept, index) => `
                <div class="concept-card bg-white p-6 rounded-lg shadow-md flex flex-col">
                      <h3 class="text-xl font-bold text-purple-700">${concept.name}</h3>
                      <p class="text-gray-600 mt-2 flex-grow text-sm">${concept.description}</p>
                      <button class="generate-analogy-btn mt-4 text-sm bg-purple-100 text-purple-700 font-semibold py-2 px-4 rounded-md hover:bg-purple-200 transition-colors" data-index="${index}">✨ Explain with an Analogy</button>
                      <div id="analogy-output-${index}" class="mt-2"></div>
                </div>
            `).join('');
        },

        renderComparisonLab() {
            const allFigures = [...this.navigators.map((p, i) => ({...p, type: 'navigator', index: i})), ...this.thinkers.map((p, i) => ({...p, type: 'thinker', index: i}))]
                .sort((a, b) => a.name.localeCompare(b.name));
            
            const figureOptions = `<option value="" disabled selected>Select a figure...</option>` + allFigures.map(person => 
                `<option value="${person.type}-${person.index}">${person.name} (${person.title})</option>`
            ).join('');

            document.getElementById('figureA-select').innerHTML = figureOptions;
            document.getElementById('figureB-select').innerHTML = figureOptions;
            
            const uniqueCapabilities = [...new Set(allFigures.flatMap(f => f.capabilities || []))].sort();
            const capabilityOptions = `<option value="" disabled selected>Select a capability...</option>` + uniqueCapabilities.map(c => `<option value="${c}">${c}</option>`).join('');
            document.getElementById('capability-select').innerHTML = capabilityOptions;
        },

        async callGeminiAPI(prompt, outputElement, button) {
            if (!this.apiKey) {
                document.getElementById('settings-api-key-modal').classList.remove('hidden');
                if(button) {
                    button.disabled = false; // Re-enable button if API key is missing
                    button.innerHTML = button.dataset.originalText;
                }
                return;
            }

            if(button){
                button.dataset.originalText = button.innerHTML;
                button.disabled = true;
                button.innerHTML = '<div class="loader" style="margin: 0 auto; width: 20px; height: 20px;"></div>';
            }
            
            outputElement.innerHTML = '<div class="loader"></div>';
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
                }

                const result = await response.json();
                
                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    outputElement.innerHTML = `<div class="gemini-output">${text.trim()}</div>`;
                } else {
                    // Handle cases where the API returns a successful status but no content
                    outputElement.innerHTML = '<p class="text-red-500 text-sm">The AI returned an empty response. Please try again.</p>';
                }

            } catch (error) {
                console.error("API call failed:", error);
                outputElement.innerHTML = `<p class="text-red-500 text-sm">An error occurred: ${error.message}</p>`;
            } finally {
                if(button){
                    button.disabled = false;
                    button.innerHTML = button.dataset.originalText;
                }
            }
        },

        setupEventListeners() {
            const startBtn = document.getElementById('start-btn');
            const privacyModal = document.getElementById('privacy-modal');
            const continueBtn = document.getElementById('continue-btn');
            const welcomeScreen = document.getElementById('welcome-screen');
            const mainContent = document.getElementById('main-content');
            
            startBtn.addEventListener('click', () => {
                welcomeScreen.classList.add('hidden');
                mainContent.classList.remove('hidden');
            });

            continueBtn.addEventListener('click', () => {
                const apiKeyInput = document.getElementById('api-key-input-modal').value.trim();
                if (apiKeyInput) {
                    this.apiKey = apiKeyInput;
                    localStorage.setItem('geminiApiKey', apiKeyInput);
                    privacyModal.classList.add('hidden');
                } else {
                    alert('Please enter an API key to continue.');
                }
            });

            const tabs = {
                navigators: { btn: document.getElementById('navigators-tab'), section: document.getElementById('navigators-section') },
                thinkers:   { btn: document.getElementById('thinkers-tab'),   section: document.getElementById('thinkers-section') },
                concepts:   { btn: document.getElementById('concepts-tab'),   section: document.getElementById('concepts-section') },
                comparison: { btn: document.getElementById('comparison-tab'), section: document.getElementById('comparison-section') },
                resonance:  { btn: document.getElementById('resonance-tab'),  section: document.getElementById('resonance-section') }
            };

            Object.values(tabs).forEach(tab => {
                tab.btn.addEventListener('click', () => {
                    Object.values(tabs).forEach(t => {
                        t.section.classList.add('hidden');
                        t.btn.setAttribute('aria-selected', 'false');
                    });
                    tab.section.classList.remove('hidden');
                    tab.btn.setAttribute('aria-selected', 'true');
                });
            });

            const detailModal = document.getElementById('detail-modal');
            document.getElementById('profile-grid').addEventListener('click', (e) => this.handleCardClick(e));
            document.getElementById('thinker-grid').addEventListener('click', (e) => this.handleCardClick(e));
            document.getElementById('close-modal').addEventListener('click', () => detailModal.classList.add('hidden'));
            detailModal.addEventListener('click', (e) => {
                if (e.target === detailModal) detailModal.classList.add('hidden');
            });
            
            const settingsApiKeyModal = document.getElementById('settings-api-key-modal');
            document.getElementById('settings-btn').addEventListener('click', () => {
                document.getElementById('api-key-input-settings').value = this.apiKey;
                settingsApiKeyModal.classList.remove('hidden');
            });
            document.getElementById('cancel-api-key-btn').addEventListener('click', () => settingsApiKeyModal.classList.add('hidden'));
            document.getElementById('save-api-key-btn').addEventListener('click', () => {
                const newKey = document.getElementById('api-key-input-settings').value.trim();
                this.apiKey = newKey;
                localStorage.setItem('geminiApiKey', newKey);
                settingsApiKeyModal.classList.add('hidden');
            });

            document.getElementById('concept-grid').addEventListener('click', (e) => {
                const button = e.target.closest('.generate-analogy-btn');
                if (button) {
                    const index = button.dataset.index;
                    const concept = this.concepts[index];
                    const outputElement = document.getElementById(`analogy-output-${index}`);
                    const prompt = `Explain the following complex ethical concept in a simple, relatable analogy for a college student: "${concept.name} - ${concept.description}".`;
                    this.callGeminiAPI(prompt, outputElement, button);
                }
            });

            const resonanceInput = document.getElementById('resonance-input');
            resonanceInput.addEventListener('input', () => {
                localStorage.setItem('resonanceInput', resonanceInput.value);
            });

            document.getElementById('find-counterparts-btn').addEventListener('click', (e) => {
                const userInput = resonanceInput.value;
                if (!userInput.trim()) {
                    alert("Please describe a value or capability first.");
                    return;
                }
                const outputElement = document.getElementById('counterparts-output');
                const allFigures = [...this.navigators, ...this.thinkers];
                const figuresData = allFigures.map(f => ({ name: f.name, capabilities: (f.capabilities || []).join(', ') }) );
                const prompt = `You are an AI assistant for a philosophy course. A student has described an ethical value or capability they care about: "${userInput}". Analyze the student's input and compare it to the following list of historical figures and their key ethical capabilities: ${JSON.stringify(figuresData, null, 2)}. Identify the top 3-5 figures who demonstrate a functionally equivalent capability. For each match, provide a brief, encouraging explanation of *how* that person's life and actions exemplify the capability the student described. Frame the response as a guide for the student's own ethical development.`;
                this.callGeminiAPI(prompt, outputElement, e.target);
            });

            document.getElementById('compare-figures-btn').addEventListener('click', (e) => {
                const valA = document.getElementById('figureA-select').value;
                const valB = document.getElementById('figureB-select').value;

                if (!valA || !valB) { alert("Please select two figures to compare."); return; }
                if (valA === valB) { alert("Please select two different figures."); return; }

                const [typeA, indexA] = valA.split('-');
                const personA = this[typeA === 'navigator' ? 'navigators' : 'thinkers'][indexA];
                const [typeB, indexB] = valB.split('-');
                const personB = this[typeB === 'navigator' ? 'navigators' : 'thinkers'][indexB];

                const outputElement = document.getElementById('comparison-output');
                const prompt = `As an AI assistant for a philosophy course, analyze the connection between ${personA.name} and ${personB.name} using 'Functional Equivalence'. Background: Different individuals, with different beliefs and histories can develop functionally equivalent ethical capabilities. Your Task: 1. Identify one or two key ethical capabilities that both individuals demonstrate. 2. Explain how each person developed this shared capability from their unique background. 3. Conclude by explaining how this demonstrates 'Functional Equivalence'. --- Profile for ${personA.name}: - Key Ideas/Values: ${personA.identityKernel || personA.broa} - Key Capabilities: ${(personA.capabilities || []).join(', ')} --- Profile for ${personB.name}: - Key Ideas/Values: ${personB.identityKernel || personB.broa} - Key Capabilities: ${(personB.capabilities || []).join(', ')}`;
                this.callGeminiAPI(prompt, outputElement, e.target);
            });

            document.getElementById('capability-select').addEventListener('change', (e) => {
                const selectedCapability = e.target.value;
                const outputElement = document.getElementById('capability-explorer-output');
                if (selectedCapability) {
                    const allFigures = [...this.navigators.map((p, i) => ({...p, type: 'navigator', originalIndex: i})), ...this.thinkers.map((p, i) => ({...p, type: 'thinker', originalIndex: i}))];
                    const matchingFigures = allFigures.filter(f => (f.capabilities || []).includes(selectedCapability));
                    
                    outputElement.innerHTML = matchingFigures.map(person => `
                        <div class="${person.type === 'navigator' ? 'profile-card' : 'thinker-card'} bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col" data-type="${person.type}" data-index="${person.originalIndex}">
                            <h3 class="text-xl font-bold ${person.type === 'navigator' ? 'text-indigo-700' : 'text-teal-700'}">${person.name}</h3>
                            <p class="text-sm text-gray-500 mb-2">${person.lifespan}</p>
                            <p class="font-semibold text-gray-800">${person.title}</p>
                            <p class="text-gray-600 mt-2 text-sm flex-grow">${person.summary}</p>
                        </div>
                    `).join('');
                    
                    outputElement.querySelectorAll('.profile-card, .thinker-card').forEach(card => {
                        card.addEventListener('click', (event) => this.handleCardClick(event));
                    });
                } else {
                    outputElement.innerHTML = '';
                }
            });
        },
        
        handleCardClick(e) {
            const card = e.target.closest('div[data-index]');
            if (card) {
                const type = card.dataset.type;
                const index = card.dataset.index;
                const data = this[type === 'navigator' ? 'navigators' : 'thinkers'][index];
                this.showDetailModal(data, type);
            }
        },

        showDetailModal(data, type) {
            const modalContent = document.getElementById('modal-content-details');
            const modal = document.getElementById('detail-modal');
            
            modalContent.innerHTML = type === 'navigator' ? this.getNavigatorModalHtml(data) : this.getThinkerModalHtml(data);
            modal.classList.remove('hidden');
            modal.querySelector('.modal-content').scrollTop = 0;

            if (type === 'navigator') {
                document.getElementById('generate-dilemma-btn').addEventListener('click', (e) => {
                    const outputElement = document.getElementById('dilemma-output');
                    const prompt = `Based on the life and ethical framework of ${data.name}, whose core values are captured in their BROA+ configuration and life story (Assembly History), generate a short, new, hypothetical ethical dilemma they might have faced. The dilemma should test their core principles. Present the scenario and then ask, 'What should ${data.name} do?'`;
                    this.callGeminiAPI(prompt, outputElement, e.target);
                });

                document.getElementById('generate-dialogue-btn').addEventListener('click', (e) => {
                    const userInput = document.getElementById('dialogue-input').value;
                    if (!userInput) { alert("Please enter a question."); return; }
                    const outputElement = document.getElementById('dialogue-output');
                    const prompt = `You are an expert in the life and philosophy of ${data.name}. A student has asked the following modern ethical question: "${userInput}". Based on ${data.name}'s known values (from their BROA+), their way of reasoning, and their life experiences (Assembly History), write a short response in their voice, explaining how they might think about this issue.`;
                    this.callGeminiAPI(prompt, outputElement, e.target.parentElement.querySelector('button'));
                });
            } 
        },

        // UPDATED to render the new detailed data structure
        getNavigatorModalHtml(data) {
             let videoButton = data.videoUrl ? `<a href="${data.videoUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"><svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>Watch Video Summary</a>` : '';
             return `
                 <h2 class="text-3xl font-bold mb-1 text-indigo-800">${data.name}</h2>
                 <p class="text-md text-gray-500 mb-2">${data.title} (${data.lifespan})</p>
                 <div class="flex space-x-4 mb-4">
                     <a href="${data.bioLink}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline text-sm">Read Full Biography ↗</a>
                     ${videoButton}
                 </div>
                 <div class="space-y-5 text-gray-700">
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Assembly History</h4><p class="text-sm">${data.assemblyHistory}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">BROA+ Configuration</h4><p class="text-sm">${data.broa}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Adaptive Temporal Coherence Function (ATCF)</h4><p class="text-sm">${data.atcf}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Future-Oriented Projections (FOP)</h4><p class="text-sm">${data.fop}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Key Ethical Capabilities</h4><ul class="list-disc list-inside mt-2 space-y-1 text-sm">${(data.capabilities || []).map(c => `<li>${c}</li>`).join('')}</ul></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Textbook Connections</h4><ul class="list-disc list-inside mt-2 space-y-1 text-sm">${(data.relatedChapters || []).map(link => `<li><strong>Chapter ${link.chapter}:</strong> ${link.topic}</li>`).join('')}</ul></div>
                     <div class="border-t pt-4 mt-4"><h4 class="font-semibold text-lg text-gray-900 mb-2">Interactive Ethical Scenarios ✨</h4><div class="mb-4"><button id="generate-dilemma-btn" class="w-full text-sm bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">Generate an Ethical Dilemma for ${data.name}</button><div id="dilemma-output" class="mt-2"></div></div><div><label for="dialogue-input" class="block text-sm font-medium">Ask ${data.name} a question about a modern issue:</label><div class="mt-1 flex rounded-md shadow-sm"><input type="text" id="dialogue-input" class="flex-1 block w-full rounded-none rounded-l-md border-gray-300" placeholder="e.g., Is social media good for society?"><button id="generate-dialogue-btn" class="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-sm hover:bg-gray-100">Ask</button></div><div id="dialogue-output" class="mt-2"></div></div></div>
                 </div>`;
        },
        
        getThinkerModalHtml(data) {
            let videoButton = data.videoUrl ? `<a href="${data.videoUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"><svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>Watch Video Summary</a>` : '';
            return `
                 <h2 class="text-3xl font-bold mb-1 text-teal-800">${data.name}</h2>
                 <p class="text-md text-gray-500 mb-4">${data.title} (${data.lifespan})</p>
                 <div class="flex space-x-4 mb-4">
                     ${videoButton}
                 </div>
                 <div class="space-y-5 text-gray-700">
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Assembly History</h4><p class="text-sm">${data.assemblyHistory}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">BROA+ Configuration</h4><p class="text-sm">${data.broa}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Adaptive Temporal Consistency (ATCF)</h4><p class="text-sm">${data.atcf}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Future-Oriented Projections (FOP)</h4><p class="text-sm">${data.fop}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Key Ethical Capabilities</h4><ul class="list-disc list-inside mt-2 space-y-1 text-sm">${(data.capabilities || []).map(c => `<li>${c}</li>`).join('')}</ul></div>
                 </div>
            `;
        }
    };

    app.init();
});


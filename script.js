document.addEventListener('DOMContentLoaded', () => {
    
    const app = {
        apiKey: '',
        
        // Load all data from the global appData object
        navigators: appData.navigators,
        thinkers: appData.thinkers,
        concepts: appData.concepts,
        foundations: appData.foundations,
        caseStudies: appData.caseStudies,
        disclaimerText: appData.disclaimerText,
        
        // Create a summary of foundations to prime the AI
        foundationSummary: `Core theoretical principles to frame your analysis: ` + (appData.foundations || []).map(f => `${f.title} - ${f.summary}`).join('; '),

        init() {
            this.loadApiKey();
            this.renderNavigators();
            this.renderThinkers();
            this.renderConcepts();
            this.renderComparisonLab();
            this.renderFoundations();
            this.renderCaseStudies();
            this.renderDisclaimer();
            this.setupEventListeners();
            
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

        renderDisclaimer() {
            const container = document.getElementById('disclaimer-container');
            if(container && this.disclaimerText) {
                container.innerHTML = `<div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert"><p class="font-bold">A Note on Interpretation</p><p>${this.disclaimerText}</p></div>`;
            }
        },

        renderFoundations() {
            const grid = document.getElementById('foundation-grid');
            if(grid && this.foundations) {
                grid.innerHTML = this.foundations.map((foundation, index) => `
                    <div class="concept-card bg-white p-6 rounded-lg shadow-md flex flex-col" data-type="foundation" data-index="${index}">
                        <h3 class="text-xl font-bold text-green-700">${foundation.title}</h3>
                        <p class="text-gray-600 mt-2 text-sm flex-grow">${foundation.summary}</p>
                        <div class="mt-4">
                            <h4 class="text-sm font-semibold text-gray-800">Key Concepts:</h4>
                            <ul class="list-disc list-inside text-sm text-gray-600">
                                ${foundation.keyConcepts.map(c => `<li>${c}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('');
            }
        },

        renderCaseStudies() {
            const grid = document.getElementById('casestudy-grid');
            if(grid && this.caseStudies){
                grid.innerHTML = this.caseStudies.map((study, index) => `
                    <div class="profile-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col" data-type="caseStudy" data-index="${index}">
                        <h3 class="text-xl font-bold text-blue-700">${study.title}</h3>
                        <p class="text-gray-600 mt-2 text-sm flex-grow">${study.summary}</p>
                    </div>
                `).join('');
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
            const allFigures = [...this.navigators, ...this.thinkers].sort((a, b) => a.name.localeCompare(b.name));
            
            const figureOptions = `<option value="" disabled selected>Select a figure...</option>` + allFigures.map(person => {
                const type = this.navigators.some(p => p.name === person.name) ? 'navigator' : 'thinker';
                const originalIndex = this[type === 'navigator' ? 'navigators' : 'thinkers'].findIndex(p => p.name === person.name);
                return `<option value="${type}-${originalIndex}">${person.name}</option>`;
            }).join('');

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
                    button.disabled = false;
                    if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
                }
                return;
            }

            if(button){
                button.dataset.originalText = button.innerHTML;
                button.disabled = true;
                button.innerHTML = '<div class="loader" style="margin: 0 auto; width: 20px; height: 20px; border-width: 2px;"></div>';
            } else {
                outputElement.innerHTML = '<div class="loader"></div>';
            }
            
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
                    throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
                }

                const result = await response.json();
                
                if (result.candidates && result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    outputElement.innerHTML = `<div class="gemini-output">${text.trim()}</div>`;
                } else {
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
            document.getElementById('start-btn').addEventListener('click', () => {
                document.getElementById('welcome-screen').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
            });

            const tabs = {
                navigators: { btn: document.getElementById('navigators-tab'), section: document.getElementById('navigators-section') },
                thinkers:   { btn: document.getElementById('thinkers-tab'),   section: document.getElementById('thinkers-section') },
                comparison: { btn: document.getElementById('comparison-tab'), section: document.getElementById('comparison-section') },
                resonance:  { btn: document.getElementById('resonance-tab'),  section: document.getElementById('resonance-section') },
                concepts:   { btn: document.getElementById('concepts-tab'),   section: document.getElementById('concepts-section') },
                foundations:{ btn: document.getElementById('foundations-tab'),section: document.getElementById('foundations-section') },
                casestudies:{ btn: document.getElementById('casestudies-tab'),section: document.getElementById('casestudies-section') }
            };

            Object.values(tabs).forEach(tab => {
                tab.btn.addEventListener('click', (e) => this.switchTab(e.target, tabs));
            });

            const detailModal = document.getElementById('detail-modal');
            document.getElementById('profile-grid').addEventListener('click', (e) => this.handleCardClick(e));
            document.getElementById('thinker-grid').addEventListener('click', (e) => this.handleCardClick(e));
            document.getElementById('casestudy-grid').addEventListener('click', (e) => this.handleCardClick(e));

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
                this.apiKey = document.getElementById('api-key-input-settings').value.trim();
                localStorage.setItem('geminiApiKey', this.apiKey);
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
                if (!userInput.trim()) { alert("Please describe a value or capability first."); return; }
                const outputElement = document.getElementById('counterparts-output');
                const figuresData = [...this.navigators, ...this.thinkers].map(f => ({
                    name: f.name,
                    details: f.fullPrfAnalysis || `Capabilities: ${(f.capabilities || []).join(', ')}. Summary: ${f.summary}`
                }));

                const prompt = `As an AI assistant, analyze a student's reflection: "${userInput}". Compare it to the historical figures below and identify the top 3-5 who demonstrate a functionally equivalent capability. For each match, briefly explain *how* their life exemplifies this capability, using the provided theoretical framework.
                ---
                **Theoretical Framework:** ${this.foundationSummary}
                ---
                **Historical Figures Data:**
                ${JSON.stringify(figuresData, null, 2)}
                ---
                Frame your response as an encouraging guide for the student's own ethical development.`;
                this.callGeminiAPI(prompt, outputElement, e.target);
            });

            document.getElementById('compare-figures-btn').addEventListener('click', (e) => {
                const valA = document.getElementById('figureA-select').value;
                const valB = document.getElementById('figureB-select').value;
                if (!valA || !valB || valA === valB) { alert("Please select two different figures."); return; }

                const [typeA, indexA] = valA.split('-');
                const personA = this[typeA === 'navigator' ? 'navigators' : 'thinkers'][indexA];
                const [typeB, indexB] = valB.split('-');
                const personB = this[typeB === 'navigator' ? 'navigators' : 'thinkers'][indexB];

                const contextA = personA.fullPrfAnalysis || `Summary: ${personA.summary}. Key Ideas: ${personA.identityKernel || personA.broa}`;
                const contextB = personB.fullPrfAnalysis || `Summary: ${personB.summary}. Key Ideas: ${personB.identityKernel || personB.broa}`;

                const outputElement = document.getElementById('comparison-output');
                const prompt = `As an AI assistant, analyze the connection between ${personA.name} and ${personB.name} using 'Functional Equivalence'.
                ---
                **Theoretical Framework:** ${this.foundationSummary}
                ---
                **Your Analysis Must:**
                1. Identify a shared ethical capability from the analyses below.
                2. Explain how each person developed this from their unique background.
                3. Conclude by explaining how this demonstrates 'Functional Equivalence'.
                ---
                **Full Analysis for ${personA.name}:**
                ${contextA}
                ---
                **Full Analysis for ${personB.name}:**
                ${contextB}
                ---`;
                this.callGeminiAPI(prompt, outputElement, e.target);
            });

            document.getElementById('capability-select').addEventListener('change', (e) => {
                const selectedCapability = e.target.value;
                const outputElement = document.getElementById('capability-explorer-output');
                if (selectedCapability) {
                    const allFigures = [...this.navigators.map((p, i) => ({...p, type: 'navigator', originalIndex: i})), ...this.thinkers.map((p, i) => ({...p, type: 'thinker', originalIndex: i}))];
                    const matchingFigures = allFigures.filter(f => (f.capabilities || []).includes(selectedCapability));
                    
                    outputElement.innerHTML = matchingFigures.map(person => `
                        <div class="${person.type}-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col" data-type="${person.type}" data-index="${person.originalIndex}">
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

        switchTab(clickedButton, tabs) {
             Object.values(tabs).forEach(t => {
                t.section.classList.add('hidden');
                t.btn.setAttribute('aria-selected', 'false');
            });
            const key = Object.keys(tabs).find(k => tabs[k].btn === clickedButton);
            if(key) {
                tabs[key].section.classList.remove('hidden');
                tabs[key].btn.setAttribute('aria-selected', 'true');
            }
        },
        
        handleCardClick(e) {
            const card = e.target.closest('div[data-index]');
            if (card) {
                const type = card.dataset.type;
                const index = card.dataset.index;
                const data = this[type === 'navigator' ? 'navigators' : (type === 'thinker' ? 'thinkers' : 'caseStudies')][index];
                this.showDetailModal(data, type);
            }
        },

        showDetailModal(data, type) {
            const modalContent = document.getElementById('modal-content-details');
            const modal = document.getElementById('detail-modal');
            
            if (type === 'navigator') modalContent.innerHTML = this.getNavigatorModalHtml(data);
            else if (type === 'thinker') modalContent.innerHTML = this.getThinkerModalHtml(data);
            else if (type === 'caseStudy') modalContent.innerHTML = this.getCaseStudyModalHtml(data);
            
            modal.classList.remove('hidden');
            modal.querySelector('.modal-content').scrollTop = 0;
            
            modalContent.querySelectorAll('[data-target-tab]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.classList.add('hidden');
                    const targetTabId = e.target.dataset.targetTab;
                    const targetButton = document.getElementById(targetTabId);
                    if(targetButton) {
                        const tabs = {
                            navigators: { btn: document.getElementById('navigators-tab'), section: document.getElementById('navigators-section') },
                            thinkers:   { btn: document.getElementById('thinkers-tab'),   section: document.getElementById('thinkers-section') },
                            comparison: { btn: document.getElementById('comparison-tab'), section: document.getElementById('comparison-section') },
                            resonance:  { btn: document.getElementById('resonance-tab'),  section: document.getElementById('resonance-section') },
                            concepts:   { btn: document.getElementById('concepts-tab'),   section: document.getElementById('concepts-section') },
                            foundations:{ btn: document.getElementById('foundations-tab'),section: document.getElementById('foundations-section') },
                            casestudies:{ btn: document.getElementById('casestudies-tab'),section: document.getElementById('casestudies-section') }
                        };
                         this.switchTab(targetButton, tabs);
                    }
                });
            });

            if (type === 'navigator') {
                document.getElementById('generate-dilemma-btn')?.addEventListener('click', (e) => {
                    const outputElement = document.getElementById('dilemma-output');
                    const context = data.fullPrfAnalysis || data.identityKernel;
                    const prompt = `Based on the detailed analysis of ${data.name}: "${context}", generate a short, new, hypothetical ethical dilemma they might have faced that tests their core principles. Present the scenario, then ask, 'What should ${data.name} do?'`;
                    this.callGeminiAPI(prompt, outputElement, e.target);
                });

                document.getElementById('generate-dialogue-btn')?.addEventListener('click', (e) => {
                    const userInput = document.getElementById('dialogue-input').value;
                    if (!userInput) { alert("Please enter a question."); return; }
                    const outputElement = document.getElementById('dialogue-output');
                    const context = data.fullPrfAnalysis || data.identityKernel;
                    const prompt = `You are an expert on ${data.name}. A student asked: "${userInput}". Based on ${data.name}'s detailed analysis: "${context}", write a short response in their voice, explaining how they might think about this issue.`;
                    this.callGeminiAPI(prompt, outputElement, e.target);
                });
            } 
        },

        getNavigatorModalHtml(data) {
             const videoButton = data.videoUrl ? `<a href="${data.videoUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"><svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>Watch Video</a>` : '';
             const foundationalLinksHtml = (data.foundationalLinks || []).length > 0 ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Theoretical Connections</h4>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        ${data.foundationalLinks.map(link => `<li><a href="#" class="text-indigo-600 hover:underline" data-target-tab="foundations-tab">${link}</a></li>`).join('')}
                    </ul>
                </div>` : '';

             const interactiveScenarios = `
                <div class="border-t pt-4 mt-4">
                    <h4 class="font-semibold text-lg text-gray-900 mb-2">Interactive Ethical Scenarios ✨</h4>
                    <div class="mb-4">
                        <button id="generate-dilemma-btn" class="w-full text-sm bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">Generate an Ethical Dilemma for ${data.name}</button>
                        <div id="dilemma-output" class="mt-2"></div>
                    </div>
                    <div>
                        <label for="dialogue-input" class="block text-sm font-medium">Ask ${data.name} a question:</label>
                        <div class="mt-1 flex rounded-md shadow-sm">
                            <input type="text" id="dialogue-input" class="flex-1 block w-full rounded-none rounded-l-md border-gray-300" placeholder="e.g., Is social media good for society?">
                            <button id="generate-dialogue-btn" class="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-sm hover:bg-gray-100">Ask</button>
                        </div>
                        <div id="dialogue-output" class="mt-2"></div>
                    </div>
                </div>`;
            
            const hasNewFormat = data.assemblyHistory && data.broa;
            const contentHtml = hasNewFormat ? `
                <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Assembly History</h4>${data.assemblyHistory}</div>
                <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">BROA+ Configuration</h4>${data.broa}</div>
                <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Adaptive Temporal Coherence (ATCF)</h4><p>${data.atcf}</p></div>
                <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Future-Oriented Projections (FOP)</h4><p>${data.fop}</p></div>
                ` : `
                <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Identity Kernel</h4><p>${data.identityKernel}</p></div>
                <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Personal Reality Framework</h4><p>${data.prf}</p></div>
                <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Dramatic Example</h4><p>${data.dramaticExample}</p></div>
                `;

            return `
                <h2 class="text-3xl font-bold mb-1 text-indigo-800">${data.name}</h2>
                <p class="text-md text-gray-500 mb-2">${data.title} (${data.lifespan})</p>
                <div class="flex space-x-4 mb-4">
                    <a href="${data.bioLink}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline text-sm">Read Full Biography ↗</a>
                    ${videoButton}
                </div>
                <div class="space-y-5 text-gray-700 text-sm">
                   ${contentHtml}
                   ${foundationalLinksHtml}
                   ${interactiveScenarios}
                </div>`;
        },

        getCaseStudyModalHtml(data) {
            return `
                 <h2 class="text-3xl font-bold mb-1 text-blue-800">${data.title}</h2>
                 <div class="space-y-5 text-gray-700 text-sm mt-4">
                    ${data.analysis}
                 </div>
            `;
        },
        
        getThinkerModalHtml(data) {
            const videoButton = data.videoUrl ? `<a ...>...</a>` : '';
            const foundationalLinksHtml = (data.foundationalLinks || []).length > 0 ? `
                <div>
                    <h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Theoretical Connections</h4>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        ${data.foundationalLinks.map(link => `<li><a href="#" class="text-indigo-600 hover:underline" data-target-tab="foundations-tab">${link}</a></li>`).join('')}
                    </ul>
                </div>` : '';

            return `
                 <h2 class="text-3xl font-bold mb-1 text-teal-800">${data.name}</h2>
                 <p class="text-md text-gray-500 mb-4">${data.title} (${data.lifespan})</p>
                 <div class="flex space-x-4 mb-4">${videoButton}</div>
                 <div class="space-y-5 text-gray-700 text-sm">
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Assembly History</h4><p>${data.assemblyHistory}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">BROA+ Configuration</h4><p>${data.broa}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Adaptive Temporal Coherence (ATCF)</h4><p>${data.atcf}</p></div>
                     <div><h4 class="font-semibold text-lg text-gray-900 border-b pb-1 mb-2">Future-Oriented Projections (FOP)</h4><p>${data.fop}</p></div>
                     ${foundationalLinksHtml}
                 </div>
            `;
        }
    };

    app.init();
});


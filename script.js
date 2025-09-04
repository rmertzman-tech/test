document.addEventListener('DOMContentLoaded', () => {

    const app = {
        apiKey: '',
        currentComparison: null,
        currentResonance: null,
        currentModalFigure: null,

        navigators: appData.navigators,
        thinkers: appData.thinkers,
        concepts: appData.concepts,
        foundations: appData.foundations,
        caseStudies: appData.caseStudies,
        essays: appData.essays,

        frameworkContext: `
            You are an expert in the "Capability-Based Coordination" philosophical system. Your entire knowledge base for this conversation is the following set of principles:
            1.  **Personal Reality Framework (PRF):** Each person has a unique architecture for organizing experience (Beliefs, Rules, Ontology, Authenticity).
            2.  **Capability-Based Coordination & Functional Equivalence:** People can coordinate by developing "functionally equivalent" capabilities to achieve shared goals, even with different beliefs.
            3.  **Adaptive Temporal Coherence Function (ATCF):** A measure of a coherent identity over time.
            4.  **Bootstrap Authority:** Normative authority emerges from demonstrated competence.
            5.  **Two Operating Systems:** People can use OS1 (Truth-Commitment) for personal meaning and OS2 (Capability-Coordination) for practical cooperation.
        `,

        init() {
            this.loadApiKey();
            this.renderAllContent();
            this.setupEventListeners();
        },

        loadApiKey() {
            const savedKey = localStorage.getItem('geminiApiKey');
            if (savedKey) {
                this.apiKey = savedKey;
            }
        },
        
        renderAllContent() {
            document.getElementById('profile-grid').innerHTML = this.navigators.map((item, index) => this.createCardHtml(item, 'navigator', index)).join('');
            document.getElementById('thinker-grid').innerHTML = this.thinkers.map((item, index) => this.createCardHtml(item, 'thinker', index)).join('');
            document.getElementById('concept-grid').innerHTML = this.concepts.map((item, index) => this.createConceptCardHtml(item, index)).join('');
            document.getElementById('foundation-grid').innerHTML = this.foundations.map((item, index) => this.createSimpleCardHtml(item, 'foundation', index)).join('');
            document.getElementById('casestudy-grid').innerHTML = this.caseStudies.map((item, index) => this.createSimpleCardHtml(item, 'casestudy', index)).join('');
            document.getElementById('essay-grid').innerHTML = this.essays.map((item, index) => this.createSimpleCardHtml(item, 'essay', index)).join('');
            
            const disclaimerEl = document.getElementById('disclaimer-text');
            if(disclaimerEl && appData.disclaimerText) disclaimerEl.textContent = appData.disclaimerText;

            this.renderComparisonLab();
        },
        
        createCardHtml(item, type, index) {
            const colors = { navigator: 'text-indigo-700', thinker: 'text-teal-700' };
            return `
                <div class="profile-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col" data-type="${type}" data-index="${index}">
                    <h3 class="text-xl font-bold ${colors[type]}">${item.name}</h3>
                    <p class="text-sm text-gray-500 mb-2">${item.lifespan}</p>
                    <p class="font-semibold text-gray-800">${item.title}</p>
                    <p class="text-gray-600 mt-2 text-sm flex-grow">${item.summary}</p>
                </div>`;
        },

        createConceptCardHtml(concept, index) {
            return `
                <div class="concept-card bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h3 class="text-xl font-bold text-purple-700">${concept.name}</h3>
                    <p class="text-gray-600 mt-2 flex-grow text-sm">${concept.description}</p>
                    <button class="generate-analogy-btn mt-4 text-sm bg-purple-100 text-purple-700 font-semibold py-2 px-4 rounded-md hover:bg-purple-200" data-index="${index}">✨ Explain with an Analogy</button>
                    <div id="analogy-output-${index}" class="mt-2 text-sm"></div>
                </div>`;
        },
        
        createSimpleCardHtml(item, type, index) {
             const colors = { foundation: 'text-gray-800', casestudy: 'text-yellow-800', essay: 'text-blue-800' };
            return `
                <div class="simple-card bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col" data-type="${type}" data-index="${index}">
                     <h3 class="text-xl font-bold ${colors[type]}">${item.title}</h3>
                     <p class="text-gray-600 mt-2 text-sm flex-grow">${item.summary}</p>
                </div>
            `;
        },

        renderComparisonLab() {
            const allFigures = [...this.navigators, ...this.thinkers].sort((a, b) => a.name.localeCompare(b.name));
            const figureOptions = `<option value="" disabled selected>Select a figure...</option>` + allFigures.map((person) => {
                const type = this.navigators.some(p => p.name === person.name) ? 'navigator' : 'thinker';
                const index = (type === 'navigator' ? this.navigators : this.thinkers).findIndex(p => p.name === person.name);
                return `<option value="${type}-${index}">${person.name}</option>`;
            }).join('');
            document.getElementById('figureA-select').innerHTML = figureOptions;
            document.getElementById('figureB-select').innerHTML = figureOptions;
            const uniqueCapabilities = [...new Set(allFigures.flatMap(f => f.capabilities || []))].sort();
            const capabilityOptions = `<option value="" disabled selected>Select a capability...</option>` + uniqueCapabilities.map(c => `<option value="${c}">${c}</option>`).join('');
            document.getElementById('capability-select').innerHTML = capabilityOptions;
        },

        async callGeminiAPI(prompt, outputElement) {
            if (!this.apiKey) {
                document.getElementById('settings-api-key-modal').classList.remove('hidden');
                outputElement.innerHTML = '';
                return false;
            }
            outputElement.innerHTML = '<div class="loader"></div>';
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error.message);
                }
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    outputElement.innerHTML = text.replace(/\n/g, '<br>');
                } else {
                    throw new Error("Received an empty or invalid response from the API.");
                }
                return true;
            } catch (error) {
                console.error("API Error:", error);
                outputElement.innerHTML = `<p class="text-red-500 text-sm">Error: ${error.message}</p>`;
                return false;
            }
        },

        setupEventListeners() {
            const startBtn = document.getElementById('start-btn');
            const welcomeScreen = document.getElementById('welcome-screen');
            const appContainer = document.getElementById('app-container');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    welcomeScreen.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                });
            }

            const tabs = {
                navigators: { btn: document.getElementById('navigators-tab'), section: document.getElementById('navigators-section') },
                thinkers:   { btn: document.getElementById('thinkers-tab'),   section: document.getElementById('thinkers-section') },
                concepts:   { btn: document.getElementById('concepts-tab'),   section: document.getElementById('concepts-section') },
                foundations:{ btn: document.getElementById('foundations-tab'),section: document.getElementById('foundations-section') },
                casestudies:{ btn: document.getElementById('casestudies-tab'),section: document.getElementById('casestudy-section') },
                essays:     { btn: document.getElementById('essays-tab'),     section: document.getElementById('essay-section') },
                comparison: { btn: document.getElementById('comparison-tab'), section: document.getElementById('comparison-section') },
                resonance:  { btn: document.getElementById('resonance-tab'),  section: document.getElementById('resonance-section') }
            };

            Object.values(tabs).forEach(tab => {
                if (tab.btn) tab.btn.addEventListener('click', () => this.activateTab(tab, tabs));
            });
            if (tabs.navigators.btn) this.activateTab(tabs.navigators, tabs);

            const detailModal = document.getElementById('detail-modal');
            document.getElementById('close-modal').addEventListener('click', () => detailModal.classList.add('hidden'));
            detailModal.addEventListener('click', e => (e.target === detailModal) && detailModal.classList.add('hidden'));
            document.querySelectorAll('.card-container').forEach(c => c.addEventListener('click', e => this.handleCardClick(e)));

            const settingsModal = document.getElementById('settings-api-key-modal');
            document.getElementById('settings-btn').addEventListener('click', () => settingsModal.classList.remove('hidden'));
            document.getElementById('cancel-api-key-btn').addEventListener('click', () => settingsModal.classList.add('hidden'));
            document.getElementById('save-api-key-btn').addEventListener('click', () => {
                const newKey = document.getElementById('api-key-input-settings').value.trim();
                this.apiKey = newKey;
                if (newKey) localStorage.setItem('geminiApiKey', newKey);
                else localStorage.removeItem('geminiApiKey');
                settingsModal.classList.add('hidden');
            });

            document.getElementById('concept-grid').addEventListener('click', e => this.handleConceptAnalogy(e));
            document.getElementById('find-counterparts-btn').addEventListener('click', () => this.handleResonanceLab());
            document.getElementById('comparison-send-btn').addEventListener('click', () => this.handleComparisonChat());
            document.getElementById('resonance-send-btn').addEventListener('click', () => this.handleResonanceChat());
            document.getElementById('compare-figures-btn').addEventListener('click', () => this.handleComparison());
            document.getElementById('capability-select').addEventListener('change', e => this.handleCapabilityExplorer(e));
        },
        
        activateTab(tab, allTabs) {
            Object.values(allTabs).forEach(t => {
                if(t.section) t.section.classList.add('hidden');
                if(t.btn) t.btn.setAttribute('aria-selected', 'false');
            });
            tab.section.classList.remove('hidden');
            tab.btn.setAttribute('aria-selected', 'true');
        },

        handleConceptAnalogy(e) {
            if (e.target.classList.contains('generate-analogy-btn')) {
                const index = e.target.dataset.index;
                const concept = this.concepts[index];
                const outputElement = document.getElementById(`analogy-output-${index}`);
                const prompt = `${this.frameworkContext}\nA student needs a simple, relatable analogy for the concept: "${concept.name} - ${concept.description}". Create an analogy in an accessible, educational tone, perhaps using examples from technology or collaborative activities.`;
                this.callGeminiAPI(prompt, outputElement);
            }
        },

        async handleResonanceLab() {
            const userInput = document.getElementById('resonance-input').value;
            if (!userInput.trim()) return;
            const outputElement = document.getElementById('counterparts-output');
            const chatContainer = document.getElementById('resonance-chat-container');
            const allFigures = [...this.navigators, ...this.thinkers];
            const figuresData = allFigures.map(f => ({ name: f.name, summary: f.summary, capabilities: (f.capabilities || []).join(', ') }));
            
            this.currentResonance = { reflection: userInput };

            const prompt = `${this.frameworkContext}\nA student's reflection: "${userInput}". From the list below, identify the top 3-5 figures with "functionally equivalent" capabilities. For each match, briefly explain the connection using framework concepts. Format as clean HTML.\nList: ${JSON.stringify(figuresData, null, 2)}`;
            
            const success = await this.callGeminiAPI(prompt, outputElement);
            if (success) chatContainer.classList.remove('hidden');
        },
        
        handleResonanceChat() {
            const userInput = document.getElementById('resonance-chat-input').value;
            if (!userInput.trim() || !this.currentResonance) return;
            const outputContainer = document.getElementById('counterparts-output');
            
            const prompt = `${this.frameworkContext}\nThis is a follow-up conversation. The student's original reflection was: "${this.currentResonance.reflection}". The AI has already provided an initial list of role models. The student's new question is: "${userInput}". Provide a concise and helpful answer that builds on the previous context. Format as clean HTML.`;
            
            this.appendChatTurn(outputContainer, userInput, prompt);
            document.getElementById('resonance-chat-input').value = '';
        },

        async handleComparison() {
            const valA = document.getElementById('figureA-select').value;
            const valB = document.getElementById('figureB-select').value;
            if (!valA || !valB || valA === valB) return;

            const [typeA, indexA] = valA.split('-');
            const personA = (typeA === 'navigator' ? this.navigators : this.thinkers)[indexA];
            const [typeB, indexB] = valB.split('-');
            const personB = (typeB === 'navigator' ? this.navigators : this.thinkers)[indexB];

            this.currentComparison = { personA, personB };

            const outputElement = document.getElementById('comparison-output');
            const chatContainer = document.getElementById('comparison-chat-container');
            
            const prompt = `${this.frameworkContext}\nAnalyze the "Functional Equivalence" between ${personA.name} and ${personB.name}.\n**${personA.name} Context:** ${personA.fullPrfAnalysis || personA.broa}\n**${personB.name} Context:** ${personB.fullPrfAnalysis || personB.broa}\nYour Task: Identify a shared ethical capability, explain how each person's unique PRF led to it, and summarize their functional equivalence. Format as clean HTML.`;
            
            const success = await this.callGeminiAPI(prompt, outputElement);
            if(success) chatContainer.classList.remove('hidden');
        },
        
        handleComparisonChat() {
            const userInput = document.getElementById('comparison-chat-input').value;
            if (!userInput.trim() || !this.currentComparison) return;
            const outputContainer = document.getElementById('comparison-output');
            const { personA, personB } = this.currentComparison;
            
            const prompt = `${this.frameworkContext}\nThis is a follow-up conversation about the comparison between ${personA.name} and ${personB.name}. The student's new question is: "${userInput}". Provide a concise, helpful answer that builds on the previous comparison, using the framework's concepts. Format as clean HTML.`;
            
            this.appendChatTurn(outputContainer, userInput, prompt);
            document.getElementById('comparison-chat-input').value = '';
        },
        
        appendChatTurn(container, userInput, prompt) {
            const userTurn = document.createElement('div');
            userTurn.className = 'p-4 mt-4 bg-indigo-50 rounded-md';
            userTurn.innerHTML = `<p class="font-semibold text-indigo-700">You asked:</p><p class="mt-1">${userInput}</p>`;
            
            const aiTurn = document.createElement('div');
            aiTurn.className = 'p-4 mt-2 bg-gray-100 rounded-md gemini-output';
            
            container.appendChild(userTurn);
            container.appendChild(aiTurn);
            
            this.callGeminiAPI(prompt, aiTurn);
        },

        handleCapabilityExplorer(e) {
            const selectedCapability = e.target.value;
            const outputElement = document.getElementById('capability-explorer-output');
            if (selectedCapability) {
                const allFigures = [...this.navigators, ...this.thinkers];
                const matchingFigures = allFigures.filter(f => (f.capabilities || []).includes(selectedCapability));
                outputElement.innerHTML = matchingFigures.map(person => {
                    const type = this.navigators.some(p => p.name === person.name) ? 'navigator' : 'thinker';
                    const index = (type === 'navigator' ? this.navigators : this.thinkers).findIndex(p => p.name === person.name);
                    return this.createCardHtml(person, type, index);
                }).join('');
            } else {
                outputElement.innerHTML = '';
            }
        },

        handleCardClick(e) {
            const card = e.target.closest('div[data-index]');
            if (card) {
                const type = card.dataset.type;
                const index = card.dataset.index;
                let data;
                switch (type) {
                    case 'navigator': data = this.navigators[index]; break;
                    case 'thinker': data = this.thinkers[index]; break;
                    case 'foundation': data = this.foundations[index]; break;
                    case 'casestudy': data = this.caseStudies[index]; break;
                    case 'essay': data = this.essays[index]; break;
                    default: return;
                }
                this.showDetailModal(data, type);
            }
        },

        showDetailModal(data, type) {
            const modalContentEl = document.getElementById('modal-content-details');
            const modal = document.getElementById('detail-modal');
            let html = '';
            this.currentModalFigure = null;

            switch (type) {
                case 'navigator':
                case 'thinker':
                    html = this.getPersonModalHtml(data, type);
                    this.currentModalFigure = data;
                    break;
                case 'foundation':
                case 'casestudy':
                case 'essay':
                    html = this.getSimpleModalHtml(data);
                    break;
            }
            
            modalContentEl.innerHTML = html;
            modal.classList.remove('hidden');
            modal.querySelector('.modal-content').scrollTop = 0;

            if (this.currentModalFigure) {
                const sendBtn = document.getElementById('modal-chat-send');
                const inputEl = document.getElementById('modal-chat-input');
                sendBtn.addEventListener('click', () => this.handleModalChat(inputEl));
                inputEl.addEventListener('keyup', (e) => (e.key === 'Enter') && sendBtn.click());
            }
        },

        handleModalChat(inputElement) {
            const userInput = inputElement.value;
            if (!userInput.trim() || !this.currentModalFigure) return;
            const outputContainer = document.getElementById('modal-chat-output');
            const data = this.currentModalFigure;

            const prompt = `
            IMPORTANT: This is a simulation. You are to respond AS the historical figure, not as an expert about them. Adopt the voice, tone, and reasoning style of ${data.name}.
            Your personality and memories are based entirely on the Personal Reality Framework (PRF) analysis provided below.
            
            A unique aspect of this simulation is that you have been comprehensively briefed on a modern philosophical system called 'Capability-Based Coordination' and modern scientific concepts. You can and should use this new knowledge to reflect upon your own life and ideas, and to answer student questions.
            
            **Your Task:**
            A student has asked you: "${userInput}"
            
            1.  **Adopt the Persona:** Answer in the voice and personality of ${data.name} as described in the PRF.
            2.  **Integrate New Knowledge:** Frame your answer using concepts from the "Capability-Based Coordination" framework (like ATCF, PRF, functional equivalence, etc.) as if you are applying these new ideas to your own experiences.
            3.  **Be an Educator:** Your goal is to teach the student about your life through the lens of this modern framework.
            4.  **Start with the Disclaimer:** Begin your entire response with the following line of HTML: <em>(This is an AI simulation based on historical records and a modern ethical framework.)</em>
            
            **Your Core Data (PRF):**
            ---
            ${data.fullPrfAnalysis || data.broa}
            ---
            
            Now, answer the student's question. Format the entire response in clean HTML.`;
            
            this.appendChatTurn(outputContainer, userInput, prompt);
            inputElement.value = '';
        },
        
        getPersonModalHtml(data, type) {
            const color = type === 'navigator' ? 'text-indigo-800' : 'text-teal-800';
            const fullAnalysisHtml = (data.fullPrfAnalysis || '').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
            return `
                <h2 class="text-3xl font-bold mb-1 ${color}">${data.name}</h2>
                <p class="text-md text-gray-500 mb-4">${data.title} (${data.lifespan})</p>
                <div class="flex space-x-4 mb-4">
                    <a href="${data.bioLink}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline text-sm">Read Full Biography ↗</a>
                </div>
                <div class="space-y-6 text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                    <div><h4>Assembly History</h4>${data.assemblyHistory || ''}</div>
                    <div><h4>BROA+ Configuration</h4>${data.broa || ''}</div>
                    <div><h4>Adaptive Temporal Coherence Function (ATCF)</h4><p>${data.atcf || ''}</p></div>
                    <div><h4>Future-Oriented Projections (FOP)</h4><p>${data.fop || ''}</p></div>
                    <div><h4>Key Ethical Capabilities</h4><ul>${(data.capabilities || []).map(c => `<li>${c}</li>`).join('')}</ul></div>
                    ${data.foundationalLinks ? `<div><h4>Foundational Links</h4><ul>${(data.foundationalLinks || []).map(link => `<li>${link}</li>`).join('')}</ul></div>` : ''}
                    ${data.fullPrfAnalysis ? `<div class="pt-4 mt-4 border-t"><h4>Full PRF Analysis</h4><p>${fullAnalysisHtml}</p></div>` : ''}
                </div>
                <div class="border-t pt-4 mt-6">
                    <h4 class="font-semibold text-lg text-gray-900 mb-2">Discuss with ${data.name} ✨</h4>
                    <div id="modal-chat-output" class="space-y-2"></div>
                    <div class="mt-4 flex rounded-md shadow-sm">
                        <input type="text" id="modal-chat-input" class="flex-1 block w-full rounded-none rounded-l-md border-gray-300" placeholder="Ask a question...">
                        <button id="modal-chat-send" class="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-sm hover:bg-gray-100 font-semibold">Send</button>
                    </div>
                </div>
            `;
        },
        
        getSimpleModalHtml(data) {
            const fullContent = data.content || data.analysis || data.summary || '';
            return `
                 <h2 class="text-3xl font-bold mb-4">${data.title}</h2>
                 <div class="prose prose-sm max-w-none text-gray-700">${fullContent.replace(/\n/g, '<br>')}</div>
            `;
        }
    };

    app.init();
});

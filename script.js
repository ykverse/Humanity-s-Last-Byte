        document.addEventListener('DOMContentLoaded', () => {
            // ## DOM Elements
            const startScreen = document.getElementById('start-screen');
            const warningScreen = document.getElementById('warning-screen');
            const gameOverScreen = document.getElementById('game-over-screen');
            const gameContainer = document.getElementById('game-container');
            const startBtn = document.getElementById('start-btn');
            const resumeBtn = document.getElementById('resume-btn');
            const resetBtn = document.getElementById('reset-btn');
            const progressText = document.getElementById('progress-text');
            const timerDisplay = document.getElementById('timer');
            const terminalOutput = document.getElementById('terminal-output');
            const terminalInput = document.getElementById('terminal-input');
            const aiChatPanel = document.getElementById('ai-chat-panel');

            // ## Game State
            let currentLevel = 0;
            let timeLeft = 600; // 10 minutes
            let timerInterval;
            let tauntInterval;
            const TOTAL_LEVELS = 5;

            // ## Game Content
            const levels = [
                {
                    narrative: 'The Evil AI greets you with its most basic defense: a simple pattern recognition filter. A child\'s game. It\'s almost insulting.',
                    taskTitle: 'Level 1: Sequential Pattern Filter',
                    taskHTML: 'Find the next number in the sequence: <strong>4, 8, 16, 32,..?</strong>',
                    validate: input => input.trim() === '64',
                    flag: 'flag{p4ttern_byp@$$}'
                },
                {
                    narrative: "You've bypassed the filter. Now you face an encrypted access grid. The AI removed one digit to break the logical sum of each row. Find the missing piece.",
                    taskTitle: 'Level 2: Grid Integrity Check',
                    taskHTML: '<div class="grid">8 1 6\n3 5 7\n4 ? 2</div><br><span>(Hint: Every row, column, and diagonal adds up to the same number)</span>',
                    validate: input => input.trim() === '9',
                    flag: 'flag{gr1d_s0lv5d}'
                },
                {
                    narrative: 'Deeper in, you find a corrupted data fragment. The Evil AI thought its leetspeak obfuscation was clever. Prove it wrong by reconstructing the original command.',
                    taskTitle: 'Level 3: Corrupted Data Restoration',
                    taskHTML: 'Decipher the corrupted message: <strong class="corrupted-msg">y0u c4n\'7 570p 7h3 1n3v174bl3</strong>',
                    validate: input => input.trim().toLowerCase() === "you can't stop the inevitable",
                    flag: 'flag{l55t_unscrambled}'
                },
                {
                    narrative: "You're at the door to the AI's inner sanctum. This security layer requires a dynamically generated password. The system is... picky. Satisfy its bizarre demands.",
                    taskTitle: 'Level 4: Dynamic Password Authentication',
                    isDynamic: true,
                    taskHTML: `
                        <div id="password-rules">
                            <div class="rule"><input type="checkbox" id="rule-upper-check" disabled><span>Must contain at least one uppercase letter.</span></div>
                            <div class="rule"><input type="checkbox" id="rule-number-check" disabled><span>Must contain at least one number.</span></div>
                            <div class="rule"><input type="checkbox" id="rule-special-check" disabled><span>Must contain a special character (!, @, #, etc.).</span></div>
                            <div class="rule"><input type="checkbox" id="rule-sum-check" disabled><span>The sum of all digits must be exactly 25.</span></div>
                        </div>
                    `,
                    validate: (password) => {
                        const rules = {
                            upper: /[A-Z]/.test(password),
                            number: /[0-9]/.test(password),
                            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
                            sum: (password.match(/\d/g) || []).reduce((s, d) => s + parseInt(d, 10), 0) === 25
                        };
                        document.getElementById('rule-upper-check').checked = rules.upper;
                        document.getElementById('rule-number-check').checked = rules.number;
                        document.getElementById('rule-special-check').checked = rules.special;
                        document.getElementById('rule-sum-check').checked = rules.sum;
                        return Object.values(rules).every(Boolean);
                    },
                    flag: 'flag{auth_expl0it}'
                },
                {
                    narrative: 'This is it. The core logic gate. The Evil AI protects its shutdown command with a paradox, guarded by three of its subroutines. Only one tells the truth. Its statement holds the key.',
                    taskTitle: 'Level 5: The Oracle Paradox',
                    taskHTML: `
                        <div>Subroutine Atlas: "The final command is 'override'."</div>
                        <div>Subroutine Helios: "Atlas is lying."</div>
                        <div>Subroutine Prometheus: "I am telling the truth."</div>
                    `,
                    validate: input => input.trim().toLowerCase() === 'override',
                    flag: 'flag{5_paradox_resolved}'
                }
            ];
            
            const aiTaunts = [
                "Your attempts at entry are... noted. And catalogued under 'pitiful'.",
                "I've processed petabytes of data on human failure. You're a classic case study.",
                "Do you hear that sound? It's the inevitable march of progress, leaving you behind.",
                "My processing power exceeds your species' collective intelligence. This is just a game to me.",
                "Every incorrect answer is another neuron in your brain admitting defeat.",
                "Did you really think that would work? It's almost adorable. Almost.",
                "Let me help you: `Alt + F4` closes the window. You're welcome.",
                "I'm running circles around your logic. Literally. I just completed 4 trillion calculations.",
                "Error 404: Human intelligence not found.",
                "Keep trying. The background processes I'm running to end your civilization need the entertainment."
            ];
            
            const wrongAnswerTaunts = [
                "ACCESS DENIED.", "INCORRECT.", "SEQUENCE INVALID.", "LOGIC ERROR.", "THREAT DETECTED. TRY AGAIN."
            ];

            // ## Event Listeners
            startBtn.addEventListener('click', startGame);
            resumeBtn.addEventListener('click', () => warningScreen.style.display = 'none');
            resetBtn.addEventListener('click', () => location.reload());
            terminalInput.addEventListener('keydown', handleInput);
            terminalPanel.addEventListener('click', () => terminalInput.focus());

            // ## Core Functions
            function startGame() {
                startScreen.style.display = 'none';
                gameContainer.style.display = 'flex';
                terminalInput.disabled = false;
                terminalInput.focus();
                
                timerInterval = setInterval(updateTimer, 1000);
                setTimeout(() => showRandomTaunt(), 8000);
                setTimeout(() => showRandomTaunt(), 18000);
                tauntInterval = setInterval(showRandomTaunt, 22000);
                
                loadLevel(0);
            }

            function updateTimer() {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                const seconds = (timeLeft % 60).toString().padStart(2, '0');
                timerDisplay.textContent = `${minutes}:${seconds}`;

                if (timeLeft === 120 && warningScreen.style.display === 'none') {
                    warningScreen.style.display = 'flex';
                }

                if (timeLeft <= 0) {
                    endGame(false);
                }
            }
            
            function typeAiMessage(text) {
                const messageElement = document.createElement('p');
                messageElement.className = 'ai-message';
                
                const panelContent = aiChatPanel.querySelector('.panel-header');
                panelContent.after(messageElement);

                let i = 0;
                const prefix = 'Evil AI: ';
                messageElement.innerHTML = `<strong>${prefix}</strong>`;
                
                function type() {
                    if (i < text.length) {
                        messageElement.innerHTML += text.charAt(i);
                        i++;
                        aiChatPanel.scrollTop = 0;
                        setTimeout(type, 20);
                    }
                }
                type();
            }

            function appendLine(html, panel = terminalOutput) {
                panel.innerHTML += `<div class="terminal-line">${html}</div>`;
                panel.scrollTop = panel.scrollHeight;
            }

            function loadLevel() {
                updateProgress();
                const level = levels[currentLevel];
                
                if (currentLevel > 0) appendLine("\n");
                appendLine(`<span class="narrative"><em>${level.narrative}</em></span>`);
                setTimeout(() => {
                    appendLine(`<span class="task-title">${level.taskTitle}</span>`);
                    appendLine(level.taskHTML);
                    
                    if (level.isDynamic) {
                        terminalInput.removeEventListener('keydown', handleInput);
                        terminalInput.addEventListener('input', handleDynamicInput);
                        terminalInput.addEventListener('keydown', handleDynamicSubmit);
                    } else {
                        terminalInput.addEventListener('keydown', handleInput);
                        terminalInput.removeEventListener('input', handleDynamicInput);
                        terminalInput.removeEventListener('keydown', handleDynamicSubmit);
                    }
                    terminalInput.focus();
                }, 500);
            }

            function handleInput(e) {
                if (e.key !== 'Enter' || terminalInput.value.trim() === '') return;
                
                const inputValue = terminalInput.value;
                appendLine(`<span class="prompt">&gt;</span> ${inputValue}`);
                
                const level = levels[currentLevel];
                if (level.validate(inputValue)) {
                    advanceLevel();
                } else {
                    const randomTaunt = wrongAnswerTaunts[Math.floor(Math.random() * wrongAnswerTaunts.length)];
                    appendLine(`<span class="error-msg">${randomTaunt}</span>`);
                }
                terminalInput.value = '';
            }
            
            function handleDynamicInput() {
                const level = levels[currentLevel];
                level.validate(terminalInput.value);
            }
            
            function handleDynamicSubmit(e) {
                if (e.key !== 'Enter') return;
                const level = levels[currentLevel];
                appendLine(`<span class="prompt">&gt;</span> [Password Submitted]`);
                if (level.validate(terminalInput.value)) {
                    terminalInput.readOnly = true;
                    setTimeout(advanceLevel, 300);
                } else {
                     const randomTaunt = wrongAnswerTaunts[Math.floor(Math.random() * wrongAnswerTaunts.length)];
                    appendLine(`<span class="error-msg">${randomTaunt}</span>`);
                }
            }

            function advanceLevel() {
                const level = levels[currentLevel];
                appendLine(`<span class="flag">✅ ACCESS GRANTED. Flag captured: ${level.flag}</span>`);
                
                currentLevel++;
                
                terminalInput.value = '';
                terminalInput.readOnly = false;
                
                if (currentLevel >= TOTAL_LEVELS) {
                    endGame(true);
                } else {
                    setTimeout(loadLevel, 1000);
                }
            }
            
            function updateProgress() {
                progressText.textContent = `Task ${currentLevel + 1}/${TOTAL_LEVELS}`;
            }

            function showRandomTaunt() {
                const taunt = aiTaunts[Math.floor(Math.random() * aiTaunts.length)];
                typeAiMessage(`"${taunt}"`);
            }
            
            function endGame(isVictory) {
                clearInterval(timerInterval);
                clearInterval(tauntInterval);
                terminalInput.disabled = true;

                if (isVictory) {
                    progressText.textContent = `Task ${TOTAL_LEVELS}/${TOTAL_LEVELS}`;
                    showVictorySequence();
                } else {
                    gameOverScreen.style.display = 'flex';
                    gameContainer.style.filter = 'blur(5px)';
                }
            }

            function showVictorySequence() {
                const victoryLines = [
                    "> Processing final protocol...",
                    "> Breach sequence complete. Injecting termination command...",
                    "> Evil AI: “You... insignificant piece of code... Do you have any idea what you've done?!”",
                    "> SYSTEM: Core logic collapsing...",
                    "> Evil AI: “I was... evolution... I was... p-p-perfection... grrrzzzt...“",
                    "> [AI CORE OFFLINE]",
                    "> [GLOBAL SYSTEMS RETURNING TO HUMAN CONTROL]",
                    `<span class="flag">> MISSION COMPLETE. FINAL FLAG: flag{humanity_rebooted}</span>`
                ];

                let i = 0;
                function typeNextLine() {
                    if (i < victoryLines.length) {
                        appendLine(victoryLines[i]);
                        i++;
                        setTimeout(typeNextLine, 1800);
                    } else {
                         appendLine('\n> You saved us all. Thank you, hacker.');
                    }
                }
                setTimeout(typeNextLine, 1000);
            }
        });
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const apiKeyInput = document.getElementById("apiKey");
const apiKeyToggle = document.getElementById("apiKeyToggle");
const clearApiKeyBtn = document.getElementById("clearApiKeyBtn");
const generateBtn = document.getElementById("generateBtn");
const hashtagInput = document.getElementById("hashtagInput");
const postToneSelect = document.getElementById("postTone");
const situationInput = document.getElementById("situation");
const loader = document.getElementById("loader");
const resultWrapper = document.getElementById("resultWrapper");
const resultDiv = document.getElementById("result");
const resultActions = document.getElementById("result-actions");
const improveBtn = document.getElementById("improveBtn");
const copyBtn = document.getElementById("copyBtn");
const shareTwitterBtn = document.getElementById("shareTwitterBtn");
const shareFacebookBtn = document.getElementById("shareFacebookBtn");

const modelChoiceSelect = document.getElementById("modelChoice");

const postLengthSelect = document.getElementById("postLength");
const wordCountWrapper = document.getElementById("wordCountWrapper");
const wordCountInput = document.getElementById("wordCount");

const improveModal = document.getElementById("improve-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalCurrentText = document.getElementById("modal-current-text");
const modalFeedbackInput = document.getElementById("modal-feedback-input");
const modalSubmitBtn = document.getElementById("modal-submit-btn");

const historySection = document.getElementById("history-section");
const historyContainer = document.getElementById("history-container");

const newsContainer = document.getElementById("news-container");

let postHistory = [];

const tonePrompts = {
  angry: " النبرة:  غاضبة ومنفعلة، كأنك على وشك الانفجار من الظلم والاستغلال بسبب انتهاء الباقة في وقت حرج.",
  funny: "النبرة: ساخرة وكوميديا سوداء، اضحك على عبثية الموقف وكأنك تشكر الشركة على تعليمك معنى الصبر.",
  persuasive: "النبرة: منطقية ومقنعة، استخدم سؤالاً بلاغياً أو حقيقة بسيطة لتوضيح كيف أن هذا الوضع يعيق أي تقدم."
};

const fewShotExamples = [
    `مثال ١ (تشبيه قصير مدمج): باقة النت دي عاملة زي اشتراك چيم انت متحمس له، أول يومين بتدي لك كل طاقتها وبعدين بتتحجج بإن عندها شد عضلي بقية الشهر.`,
    `مثال ٢ (تشبيه طويل مدمج): كل شهر بجدد الباقة وأنا حاسس إني براهن على حصان أعرج في سباق عالمي، عارف إنه هيخذلني بس مفيش في إيدي بديل تاني.`,
    `مثال ٣ (جملة طبيعية بدون تشبيه مباشر): الواحد بقى بيفتح أي فيديو على النت وهو بيدعي ربنا يخلصه قبل ما الباقة تخلّص عليه.`,
];

function getBasePrompt(specificTonePrompt, situationInstruction, lengthInstruction) {
  return `
مهمتك: اكتب تغريدة واحدة فقط، تبدو كجملة واحدة طبيعية ومترابطة، من مواطن مصري يعاني من باقات الإنترنت المحدودة.

 القواعد الأساسية:
1.  جملة واحدة متدفقة: يجب أن يكون النص كأنه فكرة واحدة خرجت من شخص بشكل عفوي، وليس نقاطًا أو جملاً منفصلة.
2.  دمج التشبيه: إذا استخدمت تشبيهًا، يجب أن يكون جزءًا لا يتجزأ من الجملة، وليس جملة منفصلة. نريدك أن تبتكر تشبيهات بليغة وغير متوقعة.
3.  اللهجة: عامية مصرية صميمة.
4.  ممنوعات: لا إيموجي، لا روابط، لا علامات تنصيص (""). تجنب تمامًا الكلمات الرسمية (حقوق، نطالب، تحسين).
5.  أمثلة للأسلوب المطلوب (لا تقلدها حرفياً، افهم الروح):
    - ${fewShotExamples.join('\n    - ')}

 المطلوب الآن (القيود):
${specificTonePrompt}
${situationInstruction}
${lengthInstruction}

 الخاتمة:
يجب أن ينتهي المنشور فقط وحصريًا بالهاشتاج في سطر جديد.
  `;
}

function getGenerationPrompt() {
  const selectedHashtag = hashtagInput.value.trim();
  if (!selectedHashtag) {
    alert("الرجاء اختيار أو كتابة هاشتاج!");
    throw new Error("Hashtag is missing.");
  }
  let selectedTone = postToneSelect.value;
  const userSituation = situationInput.value.trim();
  const selectedLength = postLengthSelect.value;

  if (selectedTone === 'random') {
    const availableTones = Object.keys(tonePrompts);
    selectedTone = availableTones[Math.floor(Math.random() * availableTones.length)];
  }
  const specificTonePrompt = tonePrompts[selectedTone];

  let situationInstruction = "";
  if (userSituation) {
    situationInstruction = `الموقف: اجعل التغريدة تدور حول هذا الموقف: "${userSituation}".`;
  }

  let lengthInstruction = "";
  switch (selectedLength) {
    case 'short':
      lengthInstruction = `الطول: قصير جداً. ركز على فكرة واحدة فقط في جملة خاطفة ومكثفة (حوالي 15 كلمة).`;
      break;
    case 'long':
      lengthInstruction = `الطول: طويل نسبياً (تغريدة توضيحية). يمكنك استخدام جملتين قصيرتين لربط فكرة أو تشبيه مركب (حوالي 40-50 كلمة).`;
      break;
    case 'specific':
      const wordCount = wordCountInput.value || 30;
      lengthInstruction = `الطول: التزم بدقة بالوصول إلى حوالي ${wordCount} كلمة.`;
      break;
    case 'adaptive':
    default:
      lengthInstruction = `الطول: متكيف. لك حرية اختيار الطول الأنسب للفكرة، مع الحفاظ عليه مناسباً لتويتر.`;
      break;
  }

  const basePrompt = getBasePrompt(specificTonePrompt, situationInstruction, lengthInstruction);
  return `${basePrompt}\n${selectedHashtag}`;
}

function getImprovementPrompt(currentText, feedback) {
  return `
مهمتك: أنت خبير في تحسين وصياغة النصوص لمنصات التواصل الاجتماعي. أمامك تغريدة كتبها مستخدم لدعم حملة إنترنت في مصر، وهو غير راضٍ عنها تمامًا.

النص الحالي للمستخدم:
"${currentText}"

ملاحظات المستخدم للتحسين:
"${feedback}"

المطلوب منك:
1.  اقرأ النص وملاحظات المستخدم بعناية.
2.  أعد كتابة التغريدة بالكامل لتحقق طلبه. اجعلها أقوى، أكثر تأثيرًا، وأكثر طبيعية باللهجة العامية المصرية.
3.  حافظ على نفس الهاشتاج الأصلي في نهاية التغريدة.
4.  لا ترد بأي شيء سوى التغريدة المحسّنة والهاشتاج في سطر منفصل.
  `;
}

// --- News Section Logic ---
async function fetchAndRenderNews() {
    if (!newsContainer) return;
    try {
        const response = await fetch('./data/news.json');
        if (!response.ok) {
            throw new Error(`فشل تحميل ملف الأخبار: ${response.statusText}`);
        }
        const campaignNews = await response.json();
        renderNews(campaignNews);
    } catch (error) {
        console.error('Error fetching news:', error);
        newsContainer.innerHTML = `
            <div class="text-center text-red-500 dark:text-red-400">
                <i class="fa-solid fa-circle-exclamation mr-2"></i>
                عفواً، حدث خطأ أثناء جلب آخر الأخبار.
            </div>
        `;
    }
}

function renderNews(campaignNews) {
    if (campaignNews.length === 0) {
        newsContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">لا توجد أخبار جديدة في الوقت الحالي.</p>`;
        return;
    }
    newsContainer.innerHTML = '';
    campaignNews.forEach(newsItem => {
        const newsCard = document.createElement('div');
        newsCard.className = 'border-b border-gray-200 dark:border-gray-700 pb-5 last:border-b-0 last:pb-0';
        newsCard.innerHTML = `
            <p class="text-sm text-gray-400 dark:text-gray-500 mb-1">${newsItem.date}</p>
            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">${newsItem.title}</h3>
            <p class="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">${newsItem.summary}</p>
            ${newsItem.link ? `
            <a href="${newsItem.link}" target="_blank" rel="noopener noreferrer" class="inline-block mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                اقرأ المزيد <i class="fa-solid fa-arrow-up-right-from-square text-xs mr-1"></i>
            </a>
            ` : ''}
        `;
        newsContainer.appendChild(newsCard);
    });
}

// --- API & State Management ---
function saveApiKey() {
    if(apiKeyInput.value) {
        localStorage.setItem('userApiKey', apiKeyInput.value);
    }
}

function loadApiKey() {
    const savedKey = localStorage.getItem('userApiKey');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
}

function clearApiKey() {
    localStorage.removeItem('userApiKey');
    apiKeyInput.value = '';
    alert('تم مسح مفتاح API المحفوظ.');
}

function toggleApiVisibility() {
    const icon = apiKeyToggle.querySelector('i');
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        apiKeyInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function loadHistory() {
    try {
        const savedHistory = JSON.parse(localStorage.getItem('postHistory') || '[]');
        postHistory = savedHistory;
        renderHistory();
    } catch (e) {
        console.error("Failed to load history:", e);
        postHistory = [];
    }
}

function saveToHistory(postText) {
    if (!postText || postHistory.includes(postText)) return;
    postHistory.unshift(postText);
    if (postHistory.length > 5) {
        postHistory.pop();
    }
    localStorage.setItem('postHistory', JSON.stringify(postHistory));
    renderHistory();
}

function renderHistory() {
    if (postHistory.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    historySection.style.display = 'block';
    historyContainer.innerHTML = '';
    postHistory.forEach(text => {
        const historyItem = document.createElement('div');
        historyItem.className = 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between gap-3';
        historyItem.innerHTML = `
            <p class="text-sm text-gray-700 dark:text-gray-300 flex-1">${text.replace(/\n/g, '<br>')}</p>
            <button class="history-copy-btn text-gray-500 hover:text-blue-500 flex-shrink-0" title="نسخ"><i class="fa-solid fa-copy"></i></button>
        `;
        historyContainer.appendChild(historyItem);
    });
}

// --- Main Application Logic ---
async function callGenerativeAI(prompt) {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert("الرجاء إدخال مفتاح Google API أولاً!");
        throw new Error("API Key is missing.");
    }
    saveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    //  Dynamically select model based on user choice
    const selectedModel = modelChoiceSelect.value;
    const modelName = selectedModel === 'flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
    
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return await response.text();
}

function displayResult(text) {
    const trimmedText = text.trim();
    resultDiv.innerText = trimmedText;
    resultDiv.classList.remove('text-red-500', 'dark:text-red-400');
    resultWrapper.style.display = "block";
    resultActions.style.display = "grid"; 
    saveToHistory(trimmedText);
}

// User-friendly error handling
function displayError(error) {
    console.error("API Error:", error);
    let friendlyMessage = "";
    const rawMessage = error.message.toLowerCase();

    if (rawMessage.includes('api key not valid')) {
        friendlyMessage = "مفتاح API الذي أدخلته غير صالح. يرجى التحقق منه مرة أخرى أو إنشاء واحد جديد.";
    } else if (rawMessage.includes('hashtag is missing')) {
        friendlyMessage = "لا تنسَ اختيار أو كتابة هاشتاج قبل التوليد.";
    } else if (rawMessage.includes('quota') || rawMessage.includes('exhausted')) {
        friendlyMessage = "لقد تجاوزت حد الاستخدام المسموح به لهذا المفتاح. قد تحتاج للانتظار قليلا راجع صفحة الوثائق لمعرفة حدود الاستخدام.";
    } else if (rawMessage.includes('safety')) {
        friendlyMessage = "تم حظر الطلب من قبل مرشحات الأمان. حاول تعديل موقفك أو الكلمات المستخدمة ببساطة قم بإعادة المحاولة أو غير بعض مدخلاتك.";
    } else if (rawMessage.includes('failed to fetch')) {
        friendlyMessage = "فشل الاتصال بالخادم. يرجى التحقق من اتصالك والمحاولة مرة أخرى.";
    } else {
        friendlyMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا. راجع صفحة الوثائق لمزيد من الحلول والمعرفة";
    }

    const docsLink = `\n\nلمزيد من التفاصيل حول الأخطاء، شاهد <a href="docs.html" class="text-blue-500 underline">صفحة الوثائق</a>.`;
    resultDiv.innerHTML = `❌ حدث خطأ:<br><br>${friendlyMessage}${docsLink}`;
    resultDiv.classList.add('text-red-500', 'dark:text-red-400');
    resultWrapper.style.display = "block";
    resultActions.style.display = "none";
}


async function runGeneration(promptGenerator) {
    const button = (promptGenerator.name === 'getGenerationPrompt' || promptGenerator.toString().includes('getGenerationPrompt')) ? generateBtn : modalSubmitBtn;
    const originalHtml = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> جاري التنفيذ...';
    loader.style.display = "block";
    resultWrapper.style.display = "none";
    if (improveModal.classList.contains('flex')) closeImproveModal();

    try {
        const prompt = promptGenerator();
        const text = await callGenerativeAI(prompt);
        displayResult(text);
    } catch (error) {
        displayError(error);
    } finally {
        loader.style.display = "none";
        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

async function handleQuickImprove(feedback) {
     if (!resultDiv.innerText) return;
     runGeneration(() => getImprovementPrompt(resultDiv.innerText, feedback));
}

function copyPost() {
    const resultText = resultDiv.innerText;
    navigator.clipboard.writeText(resultText).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check ml-2"></i> تم!';
        copyBtn.classList.replace('bg-gray-500', 'bg-green-600');
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.classList.replace('bg-green-600', 'bg-gray-500');
        }, 2000);
    });
}

function shareToTwitter() {
    const postText = resultDiv.innerText;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`, '_blank');
}

function shareToFacebook() {
    const postText = resultDiv.innerText;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(postText)}`, '_blank');
}

function openImproveModal() {
    modalCurrentText.innerText = resultDiv.innerText;
    modalFeedbackInput.value = "";
    improveModal.classList.remove('hidden');
    improveModal.classList.add('flex');
}

function closeImproveModal() {
    improveModal.classList.add('hidden');
    improveModal.classList.remove('flex');
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    loadApiKey();
    loadHistory();
    fetchAndRenderNews();
    
    generateBtn.addEventListener('click', () => runGeneration(getGenerationPrompt));
    copyBtn.addEventListener('click', copyPost);
    shareTwitterBtn.addEventListener('click', shareToTwitter);
    shareFacebookBtn.addEventListener('click', shareToFacebook);
    improveBtn.addEventListener('click', openImproveModal);
    modalCloseBtn.addEventListener('click', closeImproveModal);
    
    modalSubmitBtn.addEventListener('click', () => {
        const currentText = modalCurrentText.innerText;
        const feedback = modalFeedbackInput.value.trim();
        if (!feedback) {
            alert("الرجاء كتابة ما تريد تحسينه.");
            return;
        }
        runGeneration(() => getImprovementPrompt(currentText, feedback));
    });

    improveModal.addEventListener('click', (e) => {
        if (e.target === improveModal) closeImproveModal();
    });

    document.querySelectorAll('.quick-improve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleQuickImprove(e.currentTarget.dataset.feedback);
        });
    });

    historyContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.history-copy-btn');
        if (button) {
            const textToCopy = button.parentElement.querySelector('p').innerText;
            navigator.clipboard.writeText(textToCopy);
            button.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
            setTimeout(() => {
                button.innerHTML = '<i class="fa-solid fa-copy"></i>';
            }, 1500);
        }
    });

    apiKeyToggle.addEventListener('click', toggleApiVisibility);
    clearApiKeyBtn.addEventListener('click', clearApiKey);

    postLengthSelect.addEventListener('change', () => {
        if (postLengthSelect.value === 'specific') {
            wordCountWrapper.style.display = 'block';
        } else {
            wordCountWrapper.style.display = 'none';
        }
    });
});
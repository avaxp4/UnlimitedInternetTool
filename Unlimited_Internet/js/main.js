
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
const hashtagSelect = document.getElementById("hashtag");

const apiKeyInput = document.getElementById("apiKey");
const generateBtn = document.getElementById("generateBtn");
const rewriteBtn = document.getElementById("rewriteBtn");
const copyBtn = document.getElementById("copyBtn");
const loader = document.getElementById("loader");
const resultWrapper = document.getElementById("resultWrapper");
const resultDiv = document.getElementById("result");


document.getElementById('year').textContent = new Date().getFullYear();


function getPrompt() {
  const selectedHashtag = hashtagSelect.value;

  return `
اكتبلي تويتة واحدة بالعربي المصري عن حملة "إنترنت غير محدود في مصر".

🎯 القواعد:

- باللهجة العامية الطبيعية بتاعة الناس، مش لازم فصحى خالص.
- بلاش أسلوب مؤسسات، حملات، مبادرات، أو أي حاجة شكلها رسمي أو ركيك.
- اكتب كأنك بتفضفض من قلبك على تويتر، مش بتكتب منشور لإعلان.
- خليها سريعة، ساخرة، غاضبة، صادقة... بس مش نكتة ولا تهريج.
- أوصف معاناة حقيقية بتحصل كل يوم: النت بيخلص وإنت لسه ما فتحتش الصفحة، الباقة بتطير، كل شوية لازم تدفع تاني.
- استخدم تشبيه واحد جديد وذكي. مش لازم يكون مضحك، بس لازم يكون بيشرح القهر. تجنب التشبيهات القديمة زي "بتخلص أسرع من المرتب" أو "بتتبخر".
- ما تطولش، خليك مركز، والتغريدة كلها ما تعديش 500 حرف.

📛 ممنوع:

- أي إيموجي، صور، روابط، علامات تنصيص.
- أي كلام عن "تحسين الخدمة"، "حقوق المواطن"، أو أي لغة بتاعة نشرات الأخبار.
- أي تلميح إن اللي كاتب الكلام هو ذكاء صناعي.
- أي كلام مكرر أو منسوخ أو بيتكرر في سياق التغريدات المعتادة.

🚫 ملحوظة مهمة جدًا:

- انهي المنشور بالسطر ده فقط:
${selectedHashtag}

- ما تذكرش الهاشتاج في أي مكان تاني.

اكتب التويتة فورًا، ومتكررهاش. عايز حاجة شكلها جديدة، حقيقية، وغريبة عن النمط المعتاد.
  `;
}


async function generatePost() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert("الرجاء إدخال مفتاح Google API أولاً!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    generateBtn.style.display = "none";
    rewriteBtn.style.display = "none";
    copyBtn.style.display = "none";
    resultWrapper.style.display = "none";
    loader.style.display = "block";

    try {
        const result = await model.generateContent(getPrompt());


        const response = await result.response;
        const text = await response.text();
        

        resultDiv.innerText = text.trim();
        resultDiv.classList.remove('text-red-500', 'dark:text-red-400');
        loader.style.display = "none";
        resultWrapper.style.display = "block";
        rewriteBtn.style.display = "flex";
        copyBtn.style.display = "flex";
        
    } catch (error) {
        console.error("API Error:", error);

        resultDiv.innerText = `❌ حدث خطأ:\n\n${error.message}\n\nتأكد من صحة مفتاح API وصلاحياته.`;
        resultDiv.classList.add('text-red-500', 'dark:text-red-400');
        loader.style.display = "none";
        resultWrapper.style.display = "block";
        generateBtn.style.display = "flex"; 
    }
}


function copyPost() {
    const resultText = resultDiv.innerText;
    navigator.clipboard.writeText(resultText).then(() => {
        const originalHTML = copyBtn.innerHTML;
        const originalClasses = copyBtn.className;
        
        copyBtn.innerHTML = '<i class="fa-solid fa-check ml-2"></i> تم النسخ!';
        copyBtn.className = originalClasses.replace('bg-gray-500', 'bg-green-600').replace('hover:bg-gray-600', 'hover:bg-green-700');
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.className = originalClasses;
        }, 2000);
    }).catch(err => {
        console.error('فشل النسخ: ', err);
        alert('حدث خطأ أثناء النسخ.');
    });
}


generateBtn.addEventListener('click', generatePost);
rewriteBtn.addEventListener('click', generatePost); 
copyBtn.addEventListener('click', copyPost);
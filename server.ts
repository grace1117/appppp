import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialize client
let aiClient: GoogleGenAI | null = null;
function getGeminiAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Fallback parsing logic
function fallbackParse(rawText: string) {
  let maxPrice = 15000;
  let needElevator = false;
  let maxDistance = '10分鐘';
  const amenities: string[] = [];

  // budget
  const priceMatches = rawText.match(/(\d+)\s*(元|塊|k|K|元以下|以下|預算)/);
  if (priceMatches && priceMatches[1]) {
    const p = parseInt(priceMatches[1]);
    if (p > 1000) maxPrice = p;
  } else {
    const anyNumMatch = rawText.match(/\b(\d{4,5})\b/);
    if (anyNumMatch && anyNumMatch[1]) {
      maxPrice = parseInt(anyNumMatch[1]);
    }
  }

  // elevator
  if (rawText.includes('電梯') || rawText.includes('有升降機')) {
    needElevator = true;
  }

  // distance
  if (rawText.includes('5分鐘') || rawText.includes('五分鐘') || rawText.includes('很近') || rawText.includes('校門口') || rawText.includes('校門')) {
    maxDistance = '5分鐘';
  } else if (rawText.includes('15分鐘') || rawText.includes('十五分鐘') || rawText.includes('較遠')) {
    maxDistance = '15分鐘';
  } else if (rawText.includes('無限制') || rawText.includes('不限距離') || rawText.includes('不限十分鐘') || rawText.includes('不限')) {
    maxDistance = '無限制';
  }

  // amenities
  const amenityKeywords = ['冷氣', '冰箱', '洗衣機', '電視', '網路', '寬頻', '陽台', '套房', '雅房', '車位', '廚房', '飲水機'];
  amenityKeywords.forEach(kw => {
    if (rawText.includes(kw)) {
      amenities.push(kw);
    }
  });

  const responseMessage = `🤖 [AI 助理解析]：已設定預算 ${maxPrice} 元、${needElevator ? '需要' : '不限'}電梯、步行距離 ${maxDistance} 內，所需設備：${amenities.join(', ') || '無特別指定'}。`;

  return {
    maxPrice,
    needElevator,
    maxDistance,
    amenities,
    responseMessage
  };
}

// Fallback recommendation logic
function generateFallbackReport(properties: any[], requirements: any) {
  const scored = properties.map(p => {
    let score = 100;
    const reasons: string[] = [];

    if (requirements?.maxPrice && p.price > requirements.maxPrice) {
      score -= 30;
      reasons.push(`租金 ($${p.price}) 超過預算`);
    } else {
      reasons.push("租金預算合適");
    }

    const titleAndDesc = (p.title + ' ' + (p.description || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
    const hasElevator = titleAndDesc.includes('電梯') || (p.floor && p.floor.includes('電梯'));
    if (requirements?.needElevator && !hasElevator) {
      score -= 25;
      reasons.push("無電梯，上下樓可能略微辛苦");
    } else if (requirements?.needElevator && hasElevator) {
      reasons.push("設有電梯符合理想");
    }

    const distMatch = p.distance?.match(/(\d+)/);
    const pDist = distMatch ? parseInt(distMatch[1]) : 15;
    let reqDist = 10;
    if (requirements?.maxDistance === '5分鐘') reqDist = 5;
    else if (requirements?.maxDistance === '15分鐘') reqDist = 15;
    else if (requirements?.maxDistance === '無限制') reqDist = 999;

    if (pDist > reqDist) {
      score -= 20;
      reasons.push(`步行 ${p.distance} 稍嫌偏遠`);
    } else {
      reasons.push("步行距離理想");
    }

    if (requirements?.amenities && requirements.amenities.length > 0) {
      const pAmenities = p.amenities || [];
      const matchedAmenities = requirements.amenities.filter((a: string) => 
        pAmenities.includes(a) || titleAndDesc.includes(a.toLowerCase())
      );
      if (matchedAmenities.length < requirements.amenities.length) {
        score -= 15;
        reasons.push(`部分心儀設備沒能齊全`);
      } else {
        reasons.push("生活設備到位");
      }
    }

    return { ...p, score, reasons };
  });

  scored.sort((a, b) => {
    return a.price - b.price;
  });
  const best = scored[0];

  let report = `### 🎯 世新 AI 推薦首選：【${best.title}】\n\n根據您在系統中設定的世新學生租屋需求，本分析強烈推薦 **${best.title}** 作為首選！\n\n`;
  report += `* **推薦原因**：此房源每月租金為 $${best.price}，步行至世新大學約為 ${best.distance}。分析評分表現出眾，契合指標：${best.reasons.join('、')}。\n`;
  
  if (scored.length > 1) {
    const second = scored[1];
    report += `\n* **替代考量：【${second.title}】**\n`;
    report += `如果您願意稍微放寬某些條件，這也是一個非常值得考慮的對象！月租金 $${second.price}，上課步行路程 ${second.distance}，適合預算與生活機能的綜合權衡。\n\n`;
  }

  // Add the explicit Price and C/P Value Comparison asked by user
  report += `### 💰 價格與性價比(C/P)綜合對比 (依價格由低到高排序)\n\n`;
  const sortedByPrice = [...scored].sort((a, b) => a.price - b.price);
  sortedByPrice.forEach((p, idx) => {
    report += `* **第 ${idx + 1} 名：【${p.title}】**  \n`;
    report += `  - 月租金：$${p.price.toLocaleString()} 元  \n`;
    report += `  - 匹配度：${p.score}%  \n`;
    report += `  - 步行距離：${p.distance}  \n`;
    report += `  - 特色優勢：${p.reasons.find(r => r.includes('合適') || r.includes('理想') || r.includes('電梯') || r.includes('設備')) || '基礎交通與預算皆能保障'}\n\n`;
  });

  report += `\n*💡 貼心提醒*：在世新生活圈看房時，可以特別注意試院路或木柵路一段的採光、通風與獨立電表計算喔！祝您早日租到理想好房！`;
  return report;
}

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "世新專屬學生租屋平台服務運作良好" });
});

// Compare & Extract AI service
app.post("/api/compare-ai", async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({ error: "Missing or invalid rawText parameter" });
  }

  const ai = getGeminiAI();
  if (!ai) {
    const result = fallbackParse(rawText);
    return res.json(result);
  }

  try {
    const prompt = `您是台灣世新大學（SHU）的專業學生租屋 AI 助手。請分析學生的租屋偏好描述文字：
"${rawText}"

請提取並返回以下這 5 個欄位：
1. maxPrice (整數型，最高預算金額。若未提及，預設為 15000。請注意字詞如 "8000"、"九千元"、"一萬一"等)
2. needElevator (布林值，是否明確要求有電梯)
3. maxDistance (自訂步行距離，必須只從這四個選項中選一個："5分鐘"、"10分鐘"、"15分鐘"、"無限制")
4. amenities (字串陣列，列出需要的設備或服務關鍵字。如 "冷氣"、"冰箱"、"洗衣機"、"陽台"、"網路"、"套房"、"雅房" 等)
5. responseMessage (一到兩句親切、道地台灣世新學生口吻的租屋小叮嚀/分析總結，字數 80 字內。可以用世新周邊熱門生活圈（如景美夜市、試院路、木柵、校門、麥當勞）來分析，顯得在地貼心！)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            maxPrice: { type: Type.INTEGER, description: "Maximum budget limit in NTD" },
            needElevator: { type: Type.BOOLEAN, description: "Whether an elevator is required" },
            maxDistance: { 
              type: Type.STRING, 
              description: "Walking distance to Shih Hsin. Must be: '5分鐘', '10分鐘', '15分鐘', '無限制'" 
            },
            amenities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of amenity strings"
            },
            responseMessage: { 
              type: Type.STRING, 
              description: "A friendly Shih Hsin local advice message" 
            }
          },
          required: ["maxPrice", "needElevator", "maxDistance", "amenities", "responseMessage"]
        }
      }
    });

    const text = response.text?.trim() || "";
    const parsedData = JSON.parse(text);
    return res.json(parsedData);
  } catch (error) {
    console.warn("Gemini invocation warning (handled with local fallback): ", error);
    const result = fallbackParse(rawText);
    return res.json({
      ...result,
      responseMessage: `⚠️ (API 處理時發生小狀況，已自動切換至本機智慧分析) ${result.responseMessage}`
    });
  }
});

// Local utility cost fallback calculator
function calculateLocalUtilityFallback(habits: any, propertyInfo: any) {
  const occupants = Number(habits.occupants) || 1;
  const acHours = Number(habits.acHours) ?? 4;
  const tvHours = Number(habits.tvHours) ?? 2;
  const computerHours = Number(habits.computerHours) ?? 6;
  const dehumidifierHours = Number(habits.dehumidifierHours) ?? 2;
  
  // Base daily electric use: Fridge (24h * 0.1 kW = 2.4 kWh), standby/lights (1.1 kWh), water pump split
  let dailyBaseElectric = 3.5 * occupants;
  
  // Appliances daily usage
  let acSummerUsage = acHours * 0.85; // 0.85 kW AC power draw
  let acWinterUsage = 0; // AC heating is rarely used
  
  let tvUsage = tvHours * 0.12; 
  let computerUsage = computerHours * 0.2;
  let dehumidifierWinterUsage = dehumidifierHours * 0.25; // 250W
  let dehumidifierSummerUsage = (dehumidifierHours > 0 ? 0.5 : 0) * 0.25; 

  // Water Heater estimation
  // Electric storage heaters consume ~4-6 kWh daily just to keep hot. Gas consumes gas.
  let heaterDailyUsage = 0;
  if (habits.waterHeaterType?.includes('電熱水器') || habits.waterHeaterType?.includes('儲熱')) {
    heaterDailyUsage = 4.5; // storage heater heat losses + showering
  } else if (habits.waterHeaterType?.includes('瞬熱')) {
    heaterDailyUsage = 2.5; // instant active load
  } else {
    heaterDailyUsage = 1.0; // gas heater split
  }

  // Monthly electricity consumption (kWh)
  const monthlySummerKwh = (dailyBaseElectric + acSummerUsage + tvUsage + computerUsage + dehumidifierSummerUsage + heaterDailyUsage) * 30;
  const monthlyWinterKwh = (dailyBaseElectric + acWinterUsage + tvUsage + computerUsage + dehumidifierWinterUsage + heaterDailyUsage) * 30;

  // Taiwan submeter rates: Summer is ~6 NTD/kWh, Winter is ~5 NTD/kWh
  const summerElectric = Math.round(monthlySummerKwh * 6.0);
  const winterElectric = Math.round(monthlyWinterKwh * 5.0);

  // Water billing: base + habits. One person typically does cubic meters
  let baseWaterPerMember = 120;
  if (habits.waterHabits?.includes('3次')) {
    baseWaterPerMember += 50;
  }
  if (habits.waterHabits?.includes('開伙')) {
    baseWaterPerMember += 40;
  }
  
  const summerWater = Math.round(baseWaterPerMember * occupants * 1.15); // Higher showers/laundry
  const winterWater = Math.round(baseWaterPerMember * occupants * 0.95);

  const totalWaterPower = summerElectric + summerWater;
  const electricityPercent = Math.round((summerElectric / totalWaterPower) * 100) || 90;
  const waterPercent = 100 - electricityPercent;

  let analysisReport = `根據估算，您在 **${propertyInfo.title}** 的夏季單月水電開銷約為 **$${(summerElectric + summerWater).toLocaleString()}** 元，冬季則約為 **$${(winterElectric + winterWater).toLocaleString()}** 元。\n\n`;
  analysisReport += `💡 **文山生活圈節能小提醒**：\n`;
  analysisReport += `1. **${habits.waterHeaterType || '電熱水器'}**：這是租屋族隱藏的耗電怪獸！如果是儲熱式電熱水器，建議平時省電不洗澡時關閉總開關，洗澡前 30 分鐘再開，每一期可以省下近 300 - 500 元電費呢！\n`;
  analysisReport += `2. **文山冬季潮濕多雨**：試院路一帶依山，冬天空氣濕冷，防霉很重要。冷氣若非 1 級能效，建議善用**除濕機**控濕（${dehumidifierHours}小時/天是合適的），冬日專用除濕機比起開冷氣除濕省電甚多！\n`;
  analysisReport += `3. **用水習慣管理**：居住人數為 ${occupants} 人，水費支出符合世新周邊套雅房之理想均值。若有公用獨立洗衣機，請盡量集中洗滌以節省多餘分攤的水電費。`;

  return {
    summerElectric,
    summerWater,
    winterElectric,
    winterWater,
    electricityPercent,
    waterPercent,
    analysisReport
  };
}

// AI personalized utility cost estimator API
app.post("/api/utility-estimate-ai", async (req, res) => {
  const { habits, propertyInfo } = req.body;
  if (!habits || !propertyInfo) {
    return res.status(400).json({ error: "Missing habits or propertyInfo parameters" });
  }

  const ai = getGeminiAI();
  if (!ai) {
    const result = calculateLocalUtilityFallback(habits, propertyInfo);
    return res.json(result);
  }

  try {
    const prompt = `您是台灣世新大學（SHU）租屋生活開銷與水電能效分析專家。請根據這位大學租客的回報習慣與特定房源特質，進行精準的夏冬季水電推估與節能生活報告。

租客回報習慣：
- 居住人數：${habits.occupants}人
- 每日在家時段：${habits.homeHours || '20:00-09:00'}
- 夏冬季冷暖氣使用頻率：${habits.acFrequency || '適度使用'}
- 洗澡次數與時間：${habits.showerDetails || '每天1次 15分鐘'}
- 熱水器類型：${habits.waterHeaterType || '儲熱式電熱水器'}
- 生活家電每日使用時數：
  * 冰箱：24 小時/天
  * 電視：${habits.tvHours ?? 2} 小時/天
  * 電腦：${habits.computerHours ?? 6} 小時/天
  * 除濕機：${habits.dehumidifierHours ?? 2} 小時/天
  * 冷氣（夏季）：${habits.acHours ?? 4} 小時/天
- 用水（洗衣與開伙）：${habits.waterHabits || '外食無洗衣服'}

房源基礎資訊：
- 名稱：${propertyInfo.title}
- 月租金額：$${propertyInfo.price} 元
- 房源內配備/設施：${(propertyInfo.amenities || []).join(', ')}

請精確計算並輸出以下 7 個 JSON 屬性：
1. summerElectric (整數，夏季單月電費。以台灣一期冷氣開啟、平均分攤電費估算，1度約5.5-6.5元)
2. summerWater (整數，夏季單一房間或全戶水費總分攤值，通常 1 人合適約 100-200 元)
3. winterElectric (整數，冬季單月電費。不開冷氣、但考量熱水器耗能增加及潮濕文山區除濕機耗能估算)
4. winterWater (整數，冬季單月水費)
5. electricityPercent (整數，電費在夏季開銷中所佔的比例，0-100)
6. waterPercent (整數，水費佔比，100-electricityPercent)
7. analysisReport (200-300字親切的台灣在地世新學長姐口吻水電節能真心關懷報告，分析電熱水器與水費特性，提醒試院路、木柵路一帶冬天空氣潮濕的除濕機管理，並給予直接又溫馨的省錢撇步，帶入「世新」、「景美夜市」、「木柵」、「試院路」等世新地標加強生活融入感)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summerElectric: { type: Type.INTEGER, description: "Summer electric bill (integer)" },
            summerWater: { type: Type.INTEGER, description: "Summer water bill (integer)" },
            winterElectric: { type: Type.INTEGER, description: "Winter electric bill (integer)" },
            winterWater: { type: Type.INTEGER, description: "Winter water bill (integer)" },
            electricityPercent: { type: Type.INTEGER, description: "Electricity share percentage" },
            waterPercent: { type: Type.INTEGER, description: "Water share percentage" },
            analysisReport: { type: Type.STRING, description: "Detailed local energy saving suggestions" }
          },
          required: ["summerElectric", "summerWater", "winterElectric", "winterWater", "electricityPercent", "waterPercent", "analysisReport"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsedData);
  } catch (error) {
    console.warn("Gemini utility estimation calculation warning (handled with local fallback): ", error);
    const result = calculateLocalUtilityFallback(habits, propertyInfo);
    return res.json({
      ...result,
      analysisReport: `⚠️ (已為您自動載入精準本機租屋智慧估算)\n\n${result.analysisReport}`
    });
  }
});

// Deep comparative recommendation AI service
app.post("/api/recommendation-ai", async (req, res) => {
  const { properties, requirements } = req.body;
  if (!properties || !Array.isArray(properties) || properties.length === 0) {
    return res.status(400).json({ error: "No properties provided for recommendation" });
  }

  const ai = getGeminiAI();
  if (!ai) {
    const report = generateFallbackReport(properties, requirements);
    return res.json({ report });
  }

  try {
    const prompt = `您是台灣世新大學租屋分析專家。
請根據學生的篩選條件：
- 最高預算：${requirements?.maxPrice || '未設定'} 元
- 電梯需求：${requirements?.needElevator ? '需要電梯' : '不限電梯'}
- 步行時間限制：${requirements?.maxDistance || '未設定'}
- 設備要求：${(requirements?.amenities || []).join(', ') || '無特別指定'}

比較並深度分析以下這幾間世新大學周邊的待選房源：
${JSON.stringify(properties, null, 2)}

請撰寫一份 200-300 字的「AI 精準租屋推薦報告」，必須包含以下幾個核心部分：
1. **首選推薦**：明確指出哪一間是最符合他們需求的首選對象，並給予具體推薦原因（結合世新生活圈，例如景美舊街、考試院、木柵路一段等）。
2. **其他替代考量**：對於其他房源，分析其特色或折衷點（例如：雖然沒有電梯，但價格較便宜、空間較大等CP值考量）。
3. **💰 價格與性價比(C/P)綜合對比 (價格由低到高)**：在報告的最後，**必須建立此專題對比小節，將所有待選房源依據價格由低到高（便宜到貴）進行精確的比較**。列出每間的租金、步行時間、匹配度等核心指標，並指出對於預算有限的世新學生來說哪一間性價比（C/P值）最高，提供直觀、清晰的價格排序建議。
4. 使用親切、具有說服力且專業的台灣繁體中文大學生語氣（如：學長姐推薦）。可以使用 markdown 格式（如 ### 標題，* 項目列表）來編排報告。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({ report: response.text?.trim() });
  } catch (error) {
    console.warn("Gemini recommendation invocation warning (handled with local fallback): ", error);
    const report = generateFallbackReport(properties, requirements);
    return res.json({ report: `⚠️ (因線上帝歸限流已自動載入本機智慧分析)\n\n${report}` });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

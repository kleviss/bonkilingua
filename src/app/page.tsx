"use client"

import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Gift,
  GraduationCap,
  Home,
  Languages,
  Menu,
  MessageSquare,
  Star,
  X,
  Zap
} from "lucide-react"
import { Card, CardContent } from "./components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { SetStateAction, useEffect, useState } from "react"

import { AVAILABLE_MODELS } from "@/constants/models"
import { Button } from "./components/ui/button"
import Link from "next/link";
import { Progress } from "@radix-ui/react-progress"
import { Textarea } from "./components/ui/textarea"

interface UserData {
  bonkPoints: number
  totalCorrections: number
  languagesLearned: string[]
  streakDays: number
  level: number
  dailyChallenge: boolean
}

interface BonkActivity {
  id: string
  amount: number
  description: string
  type: string
}

export default function LanguageLearnerApp() {
  const [userData, setUserData] = useState<UserData>({
    bonkPoints: 1250,
    totalCorrections: 47,
    languagesLearned: ["english", "spanish"],
    streakDays: 5,
    level: 3,
    dailyChallenge: false
  })

  const [inputText, setInputText] = useState("")
  const [correctedText, setCorrectedText] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "rewards">("home")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoDetect, setAutoDetect] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo")
  // Track copy status for the "Copy Corrected Text" button
  const [isCopied, setIsCopied] = useState(false)

  const [bonkActivity] = useState<BonkActivity[]>([
    { id: "1", amount: 100, description: "Completed daily challenge", type: "challenge" },
    { id: "2", amount: 50, description: "Corrected 50 sentences", type: "milestone" },
    { id: "3", amount: 200, description: "Streak bonus", type: "streak" }
  ])

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("languageLearnerData")
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setUserData(prev => ({ ...prev, ...parsed }))
    }
  }, [])

  // Auto-detect language when text changes
  useEffect(() => {
    if (inputText.trim() && autoDetect) {
      detectLanguage(inputText)
    } else {
      setDetectedLanguage(null)
    }
  }, [inputText, autoDetect])

  // Save user data to localStorage
  const saveUserData = (newData: UserData) => {
    setUserData(newData)
    localStorage.setItem("languageLearnerData", JSON.stringify(newData))
  }

  // Simple language detection simulation
  const detectLanguage = (text: string) => {
    const cleanText = text.toLowerCase().trim()

    // Spanish patterns
    if (cleanText.match(/\b(el|la|los|las|un|una|de|en|que|es|por|para|con|se|no|te|le|da|su|por|más|pero|todo|bien|sí|muy|cuando|donde|como|tiempo|año|día|casa|vida|mundo|país|ciudad|trabajo|persona|hombre|mujer|niño|parte|lugar|forma|caso|grupo|problema|mano|ojo|agua|fuego|tierra|aire|sol|luna|estrella|cielo|mar|río|montaña|árbol|flor|animal|perro|gato|pájaro|pez|comida|pan|agua|leche|café|té|cerveza|vino|carne|pollo|pescado|verdura|fruta|manzana|naranja|plátano|limón|tomate|patata|arroz|pasta|queso|huevo|azúcar|sal|aceite|mantequilla|helado|chocolate|dulce|amargo|salado|picante|caliente|frío|grande|pequeño|alto|bajo|largo|corto|ancho|estrecho|grueso|delgado|pesado|ligero|duro|blando|liso|rugoso|limpio|sucio|nuevo|viejo|joven|viejo|bueno|malo|bonito|feo|fácil|difícil|rápido|lento|fuerte|débil|rico|pobre|feliz|triste|contento|enfadado|sorprendido|asustado|cansado|enfermo|sano|hambriento|sediento|calor|frío|dolor|amor|odio|miedo|esperanza|sueño|realidad|verdad|mentira|paz|guerra|libertad|esclavitud|justicia|injusticia|bien|mal|correcto|incorrecto|posible|imposible|necesario|innecesario|importante|sin importancia|interesante|aburrido|divertido|serio|cómico|trágico|romántico|misterioso|aventurero|peligroso|seguro|arriesgado|confiable|desconfiable|honesto|deshonesto|amable|cruel|generoso|egoísta|paciente|impaciente|valiente|cobarde|inteligente|tonto|sabio|ignorante|educado|maleducado|cortés|grosero|simpático|antipático|tímido|extrovertido|optimista|pesimista|realista|idealista|conservador|liberal|tradicional|moderno|clásico|contemporáneo|antiguo|reciente|pasado|presente|futuro|antes|después|durante|mientras|hasta|desde|para|por|sin|con|contra|entre|sobre|bajo|dentro|fuera|cerca|lejos|aquí|allí|donde|cuando|cómo|por qué|qué|quién|cuál|cuánto|cuándo|dónde|sí|no|tal vez|quizás|seguramente|probablemente|posiblemente|definitivamente|absolutamente|completamente|totalmente|parcialmente|casi|apenas|solamente|únicamente|especialmente|particularmente|generalmente|normalmente|usualmente|frecuentemente|raramente|nunca|siempre|a veces|de vez en cuando|todos los días|cada día|una vez|dos veces|muchas veces|pocas veces|primera vez|última vez|próxima vez|esta vez|esa vez|aquella vez|ahora|entonces|luego|después|antes|mientras tanto|al mismo tiempo|al final|al principio|en el medio|por último|finalmente|en conclusión|en resumen|por ejemplo|es decir|o sea|además|también|tampoco|sin embargo|no obstante|por el contrario|en cambio|por otro lado|de hecho|en realidad|efectivamente|ciertamente|obviamente|evidentemente|claramente|naturalmente|lógicamente|razonablemente|comprensiblemente|afortunadamente|desafortunadamente|por suerte|por desgracia|gracias a dios|ojalá|si dios quiere|dios mío|por favor|gracias|de nada|perdón|disculpe|lo siento|no hay problema|está bien|muy bien|perfecto|excelente|fantástico|maravilloso|increíble|impresionante|sorprendente|extraordinario|espectacular|magnífico|estupendo|genial|fabuloso|bárbaro|buenísimo|malísimo|horrible|terrible|espantoso|asqueroso|repugnante|desagradable|molesto|fastidioso|irritante|insoportable|inaguantable|intolerable)/)) {
      setDetectedLanguage("spanish")
      return
    }

    // French patterns
    if (cleanText.match(/\b(le|la|les|un|une|des|de|du|en|que|est|pour|avec|se|ne|te|lui|son|sa|ses|plus|mais|tout|bien|très|quand|où|comme|temps|année|jour|maison|vie|monde|pays|ville|travail|personne|homme|femme|enfant|partie|lieu|forme|cas|groupe|problème|main|œil|eau|feu|terre|air|soleil|lune|étoile|ciel|mer|rivière|montagne|arbre|fleur|animal|chien|chat|oiseau|poisson|nourriture|pain|eau|lait|café|thé|bière|vin|viande|poulet|poisson|légume|fruit|pomme|orange|banane|citron|tomate|pomme de terre|riz|pâtes|fromage|œuf|sucre|sel|huile|beurre|glace|chocolat|doux|amer|salé|épicé|chaud|froid|grand|petit|haut|bas|long|court|large|étroit|épais|mince|lourd|léger|dur|mou|lisse|rugueux|propre|sale|nouveau|vieux|jeune|vieux|bon|mauvais|beau|laid|facile|difficile|rapide|lent|fort|faible|riche|pauvre|heureux|triste|content|en colère|surpris|effrayé|fatigué|malade|sain|affamé|assoiffé|chaleur|froid|douleur|amour|haine|peur|espoir|rêve|réalité|vérité|mensonge|paix|guerre|liberté|esclavage|justice|injustice|bien|mal|correct|incorrect|possible|impossible|nécessaire|inutile|important|sans importance|intéressant|ennuyeux|amusant|sérieux|comique|tragique|romantique|mystérieux|aventureux|dangereux|sûr|risqué|fiable|peu fiable|honnête|malhonnête|gentil|cruel|généreux|égoïste|patient|impatient|courageux|lâche|intelligent|stupide|sage|ignorant|poli|impoli|courtois|grossier|sympathique|antipathique|timide|extraverti|optimiste|pessimiste|realiste|idéaliste|conservateur|libéral|traditionnel|moderne|classique|contemporain|antiguo|récent|passé|présent|futur|avant|après|pendant|tandis que|jusqu'à|depuis|pour|par|sans|avec|contre|entre|sur|sous|dans|dehors|près|loin|ici|là|où|quand|comment|pourquoi|quoi|qui|quel|combien|quand|où|oui|non|peut-être|sûrement|probablement|possiblement|définitivement|absolument|complètement|totalement|partiellement|presque|à peine|seulement|uniquement|spécialement|particulièrement|généralement|normalement|habituellement|fréquemment|rarement|jamais|toujours|parfois|de temps en temps|tous les jours|chaque jour|une fois|deux fois|plusieurs fois|peu de fois|première fois|dernière fois|prochaine fois|cette fois|cette fois-là|maintenant|alors|puis|après|avant|en attendant|en même temps|à la fin|au début|au milieu|infine|finalement|en conclusion|en résumé|par exemple|c'est-à-dire|en outre|aussi|non plus|cependant|néanmoins|au contraire|en revanche|d'autre part|en fait|en réalité|effectivement|certainement|évidemment|clairement|naturellement|logiquement|raisonnablement|compréhensiblement|heureusement|malheureusement|par chance|par malheur|grâce à dieu|pourvu que|si dieu le veut|mon dieu|s'il vous plaît|merci|de rien|pardon|excusez-moi|je suis désolé|pas de problème|ça va|très bien|parfait|excellent|fantastique|merveilleux|incroyable|impressionnant|surprenant|extraordinaire|spectaculaire|magnifique|formidable|génial|fabuleux|super|très bon|très mauvais|horrible|terrible|épouvantable|dégoûtant|répugnant|désagréable|gênant|fastidieux|irritant|insupportable|intolérable)/)) {
      setDetectedLanguage("french")
      return
    }

    // German patterns
    if (cleanText.match(/\b(der|die|das|den|dem|des|ein|eine|eines|einem|einen|einer|und|oder|aber|nicht|ist|sind|war|waren|haben|hat|hatte|hatten|werden|wird|wurde|wurden|sein|ich|du|er|sie|es|wir|ihr|sie|mein|dein|sein|ihr|unser|euer|für|von|zu|mit|nach|bei|über|unter|vor|hinter|zwischen|durch|ohne|gegen|während|seit|bis|um|an|auf|in|im|am|zum|zur|vom|beim|ins|ans|aufs|fürs|durchs|ums|zeit|jahr|tag|haus|leben|welt|land|stadt|arbeit|mensch|mann|frau|kind|teil|ort|art|fall|gruppe|problem|hand|auge|wasser|feuer|erde|luft|sonne|mond|stern|himmel|meer|fluss|berg|baum|blume|tier|hund|katze|vogel|fisch|essen|brot|wasser|milch|kaffee|tee|bier|wein|fleisch|huhn|fisch|gemüse|obst|apfel|orange|banane|zitrone|tomate|kartoffel|reis|nudeln|käse|ei|zucker|salz|öl|butter|eis|schokolade|süß|bitter|salzig|scharf|heiß|kalt|groß|klein|hoch|niedrig|lang|kurz|breit|schmal|dick|dünn|schwer|leicht|hart|weich|glatt|rau|sauber|schmutzig|neu|alt|jung|alt|gut|schlecht|schön|hässlich|einfach|schwer|schnell|langsam|stark|schwach|reich|arm|glücklich|traurig|zufrieden|wütend|überrascht|ängstlich|müde|krank|gesund|hungrig|durstig|hitze|kälte|schmerz|liebe|hass|angst|hoffnung|traum|realität|wahrheit|lüge|frieden|krieg|freiheit|sklaverei|gerechtigkeit|ungerechtigkeit|gut|böse|richtig|falsch|möglich|unmöglich|notwendig|unnötig|wichtig|unwichtig|interessant|langweilig|lustig|ernst|komisch|tragisch|romantisch|geheimnisvoll|abenteuerlich|gefährlich|sicher|riskant|zuverlässig|unzuverlässig|ehrlich|unehrlich|freundlich|grausam|großzügig|egoistisch|geduldig|ungeduldig|mutig|feige|intelligent|dumm|weise|unwissend|höflich|unhöflich|höflich|grob|sympathisch|unsympathisch|schüchtern|extrovertiert|optimista|pessimista|realista|idealista|konservativ|liberal|traditionell|modern|klassisch|zeitgenössisch|alt|neu|vergangenheit|gegenwart|zukunft|vorher|nachher|während|während|bis|seit|für|durch|ohne|mit|gegen|zwischen|über|unter|innerhalb|außerhalb|nah|weit|hier|dort|wo|wann|wie|warum|was|wer|welche|wie viel|wann|wo|ja|nein|vielleicht|sicherlich|wahrscheinlich|möglicherweise|definitiv|absolut|vollständig|total|teilweise|fast|kaum|nur|einzig|besonders|besonders|allgemein|normalerweise|gewöhnlich|häufig|selten|nie|immer|manchmal|von zeit zu zeit|jeden tag|jeden tag|einmal|zweimal|viele male|wenige male|erste mal|letzte mal|nächste mal|dieses mal|damals|jetzt|dann|danach|vorher|inzwischen|gleichzeitig|am ende|am anfang|in der mitte|schließlich|endlich|zusammenfassend|zusammenfassend|zum beispiel|das heißt|außerdem|auch|auch nicht|jedoch|trotzdem|im gegenteil|andererseits|andererseits|tatsächlich|in wirklichkeit|tatsächlich|sicherlich|offensichtlich|klar|natürlich|logisch|vernünftig|verständlich|glücklicherweise|unglücklicherweise|zum glück|leider|gott sei dank|hoffentlich|so gott will|mein gott|bitte|danke|bitte schön|entschuldigung|entschuldigen sie|es tut mir leid|kein problem|es ist okay|sehr gut|perfekt|ausgezeichnet|fantastisch|wunderbar|unglaublich|beeindruckend|überraschend|außergewöhnlich|spektakulär|großartig|toll|genial|fabelhaft|super|sehr gut|sehr schlecht|schrecklich|furchtbar|abscheulich|ekelhaft|widerlich|unangenehm|störend|lästig|irritierend|unerträglich|unzumutbar|untragbar)/)) {
      setDetectedLanguage("german")
      return
    }

    // Italian patterns
    if (cleanText.match(/\b(il|la|lo|gli|le|un|una|uno|di|da|in|con|su|per|tra|fra|a|del|della|dello|dei|delle|degli|dal|dalla|dallo|dai|dalle|dagli|nel|nella|nello|nei|nelle|negli|col|coi|colla|colle|collo|sul|sulla|sullo|sui|sulle|sugli|e|o|ma|non|è|sono|era|erano|tenho|tens|tem|temos|tendes|têm|tinha|tinhas|tinha|tínhamos|tínheis|tinham|serei|serás|será|seremos|sereis|serão|eu|tu|ele|ela|nós|vós|eles|elas|meu|teu|seu|nosso|vosso|seu|tempo|ano|dia|casa|vida|mundo|paese|città|lavoro|persona|uomo|donna|bambino|parte|posto|modo|caso|grupo|problema|mão|olho|água|fogo|terra|ar|sol|lua|estrela|céu|mar|rio|montanha|árvore|flor|animal|cão|gato|uccello|pesce|cibo|pane|acqua|latte|caffè|tè|birra|vino|carne|pollo|pesce|verdura|frutta|mela|arancia|banana|limão|tomate|batata|arroz|massa|queijo|ovo|açúcar|sal|azeite|manteiga|gelado|chocolate|doce|amargo|salgado|picante|quente|frio|grande|pequeno|alto|baixo|comprido|curto|largo|estreito|grosso|fino|pesado|leve|duro|mole|liso|rugoso|limpo|sujo|novo|velho|jovem|velho|bom|mau|bonito|feio|fácil|difícil|rápido|lento|forte|fraco|rico|pobre|feliz|triste|contente|zangado|surpreso|assustado|cansado|doente|saudável|com fome|com sede|calor|frio|dor|amor|ódio|medo|esperança|sonho|realidade|verdade|mentira|paz|guerra|liberdade|escravidão|justiça|injustiça|bem|mal|certo|errado|possível|impossível|necessário|desnecessário|importante|senza importanza|interessante|aborrecido|divertido|sério|cómico|trágico|romântico|misterioso|aventureiro|perigoso|seguro|arriscado|confiável|não confiável|honesto|desonesto|amável|cruel|generoso|egoísta|paciente|impaciente|corajoso|codardo|inteligente|estúpido|sábio|ignorante|educado|mal educado|cortês|grosseiro|simpático|antipático|tímido|extrovertido|otimista|pessimista|realista|idealista|conservatore|liberale|tradizionale|moderno|classico|contemporaneo|antico|recente|passato|presente|futuro|prima|dopo|durante|mentre|fino|da|per|senza|con|contro|tra|sopra|sotto|dentro|fuori|vicino|lontano|qui|lì|dove|quando|come|perché|cosa|chi|quale|quanto|quando|dove|sim|não|talvez|certamente|provavelmente|possivelmente|definitivamente|absolutamente|completamente|totalmente|parcialmente|quase|apenas|só|unicamente|especialmente|particularmente|geralmente|normalmente|habitualmente|frequentemente|raramente|nunca|sempre|às vezes|de vez em quando|todos os dias|cada dia|uma vez|duas vezes|muitas vezes|poucas vezes|primeira vez|última vez|próxima vez|esta vez|essa vez|agora|então|depois|antes|entretanto|ao mesmo tempo|no fim|no início|no meio|finalmente|enfim|em conclusão|em resumo|por exemplo|ou seja|além disso|também|também não|no entanto|contudo|pelo contrário|em contrapartida|por outro lado|de facto|na realidade|efetivamente|certamente|obviamente|claramente|naturalmente|logicamente|razoavelmente|compreensivelmente|felizmente|infelizmente|por sorte|por azar|graças a deus|oxalá|se deus quiser|meu deus|por favor|obrigado|de nada|desculpa|desculpe|lamento|não há problema|está bem|muito bem|perfeito|excelente|fantástico|maravilhoso|incrível|impressionante|surpreendente|extraordinário|espetacular|magnífico|estupendo|genial|fabuloso|ótimo|muito bom|péssimo|horrível|terrível|assustador|nojento|repugnante|desagradável|chato|aborrecido|irritante|insuportável|inaceitável|intolerável)/)) {
      setDetectedLanguage("italian")
      return
    }

    // Portuguese patterns
    if (cleanText.match(/\b(o|a|os|as|um|uma|uns|umas|de|da|do|das|dos|em|na|no|nas|nos|com|para|por|entre|sobre|sob|dentro|fora|perto|longe|e|ou|mas|não|é|são|era|eram|tenho|tens|tem|temos|tendes|têm|tinha|tinhas|tinha|tínhamos|tínheis|tinham|serei|serás|será|seremos|sereis|serão|eu|tu|ele|ela|nós|vós|eles|elas|meu|teu|seu|nosso|vosso|seu|tempo|ano|dia|casa|vida|mundo|país|cidade|trabalho|pessoa|homem|mulher|criança|parte|lugar|forma|caso|grupo|problema|mão|olho|água|fogo|terra|ar|sol|lua|estrela|céu|mar|rio|montanha|árvore|flor|animal|cão|gato|pássaro|peixe|comida|pão|água|leite|café|chá|cerveja|vinho|carne|frango|peixe|verdura|fruta|maçã|laranja|banana|limão|tomate|batata|arroz|massa|queijo|ovo|açúcar|sal|azeite|manteiga|gelado|chocolate|doce|amargo|salgado|picante|quente|frio|grande|pequeno|alto|baixo|comprido|curto|largo|estreito|grosso|fino|pesado|leve|duro|mole|liso|rugoso|limpo|sujo|novo|velho|jovem|velho|bom|mau|bonito|feio|fácil|difícil|rápido|lento|forte|fraco|rico|pobre|feliz|triste|contente|zangado|surpreso|assustado|cansado|doente|saudável|com fome|com sede|calor|frio|dor|amor|ódio|medo|esperança|sonho|realidade|verdade|mentira|paz|guerra|liberdade|escravidão|justiça|injustiça|bem|mal|certo|errado|possível|impossível|necessário|desnecessário|importante|senza importância|interessante|aborrecido|divertido|sério|cómico|trágico|romântico|misterioso|aventureiro|perigoso|seguro|arriscado|confiável|não confiável|honesto|desonesto|amável|cruel|generoso|egoísta|paciente|impaciente|corajoso|codardo|inteligente|estúpido|sábio|ignorante|educado|mal educado|cortês|grosseiro|simpático|antipático|tímido|extrovertido|otimista|pessimista|realista|idealista|conservador|liberal|tradizionale|moderno|classico|contemporaneo|antigo|recente|passado|presente|futuro|antes|depois|durante|enquanto|até|desde|para|por|sem|com|contra|entre|sobre|sob|dentro|fora|perto|longe|aqui|ali|onde|quando|como|porquê|o que|quem|qual|quanto|quando|dove|sim|não|talvez|certamente|provavelmente|possivelmente|definitivamente|absolutamente|completamente|totalmente|parcialmente|quase|apenas|só|unicamente|especialmente|particularmente|geralmente|normalmente|habitualmente|frequentemente|raramente|nunca|sempre|às vezes|de vez em quando|todos os dias|cada dia|uma vez|duas vezes|muitas vezes|poucas vezes|primeira vez|última vez|próxima vez|esta vez|essa vez|agora|então|depois|antes|entretanto|ao mesmo tempo|no fim|no início|no meio|finalmente|enfim|em conclusão|em resumo|por exemplo|ou seja|além disso|também|também não|no entanto|contudo|pelo contrário|em contrapartida|por outro lado|de facto|na realidade|efetivamente|certamente|obviamente|claramente|naturalmente|logicamente|razoavelmente|compreensivelmente|felizmente|infelizmente|por sorte|por azar|graças a deus|oxalá|se deus quiser|meu deus|por favor|obrigado|de nada|desculpa|desculpe|lamento|não há problema|está bem|muito bem|perfeito|excelente|fantástico|maravilhoso|incrível|impressionante|surpreendente|extraordinário|espetacular|magnífico|estupendo|genial|fabuloso|ótimo|muito bom|péssimo|horrível|terrível|assustador|nojento|repugnante|desagradável|chato|aborrecido|irritante|insuportável|inaceitável|intolerável)/)) {
      setDetectedLanguage("portuguese")
      return
    }

    // Default to English if no other language detected
    setDetectedLanguage("english")
  }

  // Simulate text analysis
  const analyzeText = async () => {
    if (!inputText.trim()) return

    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsAnalyzing(false)
  }

  // AI text correction via OpenAI
  const correctText = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          model: selectedModel,
          language: selectedLanguage
        })
      });

      if (!res.ok) {
        throw new Error("Failed to fetch correction");
      }

      const data = await res.json();
      setCorrectedText(data.corrected);

      // Award BONK points
      const bonkEarned = Math.floor(Math.random() * 10) + 5;
      const newUserData = {
        ...userData,
        bonkPoints: userData.bonkPoints + bonkEarned,
        totalCorrections: userData.totalCorrections + 1,
        languagesLearned: userData.languagesLearned.includes(selectedLanguage)
          ? userData.languagesLearned
          : [...userData.languagesLearned, selectedLanguage]
      };

      saveUserData(newUserData);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while contacting GPT. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" }
  ]

  const models = AVAILABLE_MODELS

  const rewards = [
    {
      id: 1,
      title: "Premium Feature",
      description: "Unlock all premium features for a month",
      cost: 500,
      icon: Star
    },
    {
      id: 2,
      title: "Exclusive Language",
      description: "Access exclusive language learning exercises",
      cost: 300,
      icon: BookOpen
    },
    {
      id: 3,
      title: "Cosmetic App Upgrades",
      description: "Customize your app with unique themes",
      cost: 200,
      icon: MessageSquare
    }
  ]

  const learningModules = [
    {
      title: "Vocabulary Quizzes",
      description: "Practice words from your corrections",
      image: "📚",
      color: "bg-orange-100"
    },
    {
      title: "Sentence Construction",
      description: "Build sentences with corrected words",
      image: "📝",
      color: "bg-blue-100"
    },
    {
      title: "Grammar Exercises",
      description: "Improve grammar with your corrections",
      image: "🎯",
      color: "bg-green-100"
    }
  ]

  const lessons = [
    {
      title: "Beginner Spanish",
      description: "Learn basic Spanish phrases and grammar",
      image: "🌮",
      color: "bg-yellow-100"
    },
    {
      title: "Intermediate French",
      description: "Enhance your French with complex sentences",
      image: "🗼",
      color: "bg-purple-100"
    }
  ]

  // Shared bottom navigation component
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200">
      <div className="px-6 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "home" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "rewards" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <Gift className="h-5 w-5" />
            <span className="text-xs font-medium">Rewards</span>
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "learn" ? "text-yellow-600" : "text-gray-400"}`}
          >
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs font-medium">Learn</span>
          </button>
        </div>
      </div>
    </div>
  )

  // Sidebar component
  const Sidebar = () => (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className="fixed right-0 top-0 bottom-0 w-72 max-w-[80%] bg-white shadow-lg z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <X
            className="h-5 w-5 text-gray-600 cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <Link
            href="/profile"
            onClick={() => setIsSidebarOpen(false)}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setIsSidebarOpen(false)}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700"
          >
            Settings
          </Link>
          <Link
            href="/history"
            onClick={() => setIsSidebarOpen(false)}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700"
          >
            History
          </Link>
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-600">GPT Model</span>
            <Select
              value={selectedModel}
              onValueChange={(value: SetStateAction<string>) => setSelectedModel(value)}
            >
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-auto text-xs text-gray-500">App version: 1.0.0</div>
        </div>
      </div>
    </>
  )

  // Reset copied state when the corrected text changes (e.g., after a new correction)
  useEffect(() => {
    setIsCopied(false)
  }, [correctedText])

  if (activeTab === "home") {
    return (
      <>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Bonkilingo</h1>
            <button onClick={() => {
              setIsSidebarOpen(true);
              console.log("sidebar open");
            }}>
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-20">
          {/* Language Selection and Auto-Detect */}
          <Card className="bg-gray-100 border-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Languages className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Target Language</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Auto-detect</span>
                    <button
                      onClick={() => setAutoDetect(!autoDetect)}
                      className={`w-10 h-6 rounded-full transition-colors ${autoDetect ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${autoDetect ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Select
                    value={autoDetect && detectedLanguage ? detectedLanguage : selectedLanguage}
                    onValueChange={(value: SetStateAction<string>) => {
                      setSelectedLanguage(value)
                      if (autoDetect) setAutoDetect(false)
                    }}
                    disabled={autoDetect && detectedLanguage !== null}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {autoDetect && detectedLanguage && (
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                      <Zap className="h-3 w-3" />
                      <span>Auto-detected: {languages.find(l => l.value === detectedLanguage)?.label}</span>
                    </div>
                  )}
                </div>

                <Textarea
                  placeholder="Enter the text you want to correct..."
                  value={inputText}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setInputText(e.target.value)}
                  className="min-h-[120px] bg-white border-gray-200 resize-none"
                />

                {isAnalyzing && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>Analyzing text...</span>
                    </div>
                    <Progress value={60} className="mt-2 h-1" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Correct Button */}
          <Button
            onClick={correctText}
            disabled={!inputText.trim() || isLoading}
            className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            {isLoading ? "Correcting..." : "Correct Text"}
          </Button>

          {/* Corrections Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Corrections</h3>
            {correctedText ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-gray-700 text-sm leading-relaxed">{correctedText}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`mt-3 w-full border-green-300 text-green-700 hover:bg-green-100 ${isCopied ? 'animate-bounce border-green-500 bg-green-50' : ''}`}
                    onClick={() => {
                      navigator.clipboard.writeText(correctedText)
                      setIsCopied(true)
                      setTimeout(() => setIsCopied(false), 2000)
                    }}
                  >
                    {isCopied ? "Copied!" : "Copy Corrected Text"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      if (correctedText) {
                        localStorage.setItem("correctedText", correctedText)
                      }
                    }}
                    asChild
                  >
                    <Link href="/explanation">Show Explanation</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No corrections yet. Tap 'Correct Text' to get started.</p>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    )
  }

  if (activeTab === "learn") {
    return (
      <>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Learn</h1>
            <button onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto pb-20">
          {/* Personalized Learning */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personalized Learning</h2>
            <div className="space-y-4">
              {learningModules.map((module, index) => (
                <Card key={index} className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${module.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {module.image}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        <Button variant="outline" size="sm" className="mt-2 text-xs">
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lessons */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Lessons</h2>
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <Card key={index} className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${lesson.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {lesson.image}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                        <Button variant="outline" size="sm" className="mt-2 text-xs">
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    )
  }

  if (activeTab === "rewards") {
    return (
      <>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <button onClick={() => setActiveTab("home")}>
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Rewards</h1>
            <div></div>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto pb-20">
          {/* BONK Balance */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">{userData.bonkPoints.toLocaleString()} BONK</h2>
          </div>

          {/* Next Reward Progress */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Next Reward</span>
                <span className="text-sm text-gray-500">250 BONK to go</span>
              </div>
              <Progress value={75} className="h-2" />
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Rewards</h3>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <Card key={reward.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <reward.icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{reward.title}</h4>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={userData.bonkPoints < reward.cost}
                        className="text-xs"
                      >
                        Redeem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* BONK Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">BONK Activity</h3>
            <div className="space-y-3">
              {bonkActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600">+{activity.amount} BONK</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isSidebarOpen && <Sidebar />}
        <BottomNavigation />
      </>
    )
  }

  return null
}

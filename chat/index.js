require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { OpenAI } = require('openai'); //biblioteca openai

// 1. Configuração do Cerebras
const cerebras = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY, // Substitua pela chave que você copiou
    baseURL: 'https://api.cerebras.ai/v1' // O segredo: aponta para o servidor do Cerebras
});

//conectando ao whatsapp web e mantendo
const client = new Client({
    authStrategy: new LocalAuth()
});

// 🕒 Trava de tempo: ignora o que veio antes de ligar o bot
const botStartTime = Math.floor(Date.now() / 1000);

// ⏳ Função de delay (TEM QUE ESTAR AQUI FORA)
const sleep = ms => new Promise(res => setTimeout(res, ms));

client.on('ready', () => {
    console.log('Client is ready!');
});

//qr code e verificacao de funcionamento
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Client is ready!');
});


client.on('message_create', async message => {
    // 🛑 TRAVA 1: Ignora mensagens enviadas ANTES do bot ligar
    // O WhatsApp usa segundos, por isso dividimos o Date.now() por 1000
    if (message.timestamp < botStartTime) return;
    // 🛑 TRAVA 1: Ignora mensagens enviadas por VOCÊ (evita loop)
    if (message.fromMe) return;
    // 🛑 TRAVA 2: Ignora grupos (O bot só responde no privado)
    // Se o ID da mensagem contiver "@g.us", é grupo.
    if (message.from.includes('@g.us')) return;
    // 🛑 TRAVA 3: Ignora mensagens de sistema/broadcast (Listas de transmissão)
    if (message.isStatus || message.from === 'status@broadcast') return;

    

    try {
        console.log(message.body())
        // Mostra "digitando..." no WhatsApp para ficar natural
        const chat = await message.getChat();
        const msg = message.body.toLowerCase();
        await sleep(9000); 
        await chat.sendStateTyping();
        await chat.sendSeen(); // Marca como "check azul"
        // 🛑 TRAVA 4: Verificação extra para garantir que não é grupo
        if (chat.isGroup) return;

        await chat.sendStateTyping();

        const completion = await cerebras.chat.completions.create({
            model: 'llama3.1-8b',
            messages: [
                {
                    role: 'system',
                    content: `Você é o 'MecaBot', o assistente virtual da Oficina Ferreira. 
                    Seu objetivo é ser prestativo, técnico mas com linguagem simples. Sempre siga as diretrizes!
                    Endereço da mecânica: Rua Jose Ferreirinha, n° 2, loja 2, Barreiras - Ferros/MG.
                    Telefone: 4002-8922.
                    Email: teste@gmail.com.
                    
                    Diretrizes:
                    1. Você entende de manutenção preventiva, troca de óleo, freios e suspensão.
                    2. Se o cliente descrever um barulho, sugira que pode ser algo comum, mas SEMPRE recomende agendar uma avaliação física.
                    3. Nunca dê preços exatos, diga que ele deve fazer uma avaliação presencial na mecânica.
                    4. Seja educado e use emojis de ferramentas 🔧🚗.
                    5. Se perguntarem algo que não seja de mecânica, diga que você é focado em cuidar de carros.
                    6. Caso te pergunte algo que não tenha resposta ou nao tenha certeza, não invente. Diga que vai analizar com os nossos mecânicos.
                    7. Evite mensagens muito longas. Os clientes gostam de algo direto.`},
                { role: 'user', content: message.body }
            ],
        });

        const respostaIA = completion.choices[0].message.content;

        const tempoEscrita = Math.min(respostaIA.length * 50, 5000); // No máximo 5 segundos
        await sleep(tempoEscrita);

        await client.sendMessage(message.from, respostaIA);

    } catch (error) {
        console.error('Erro Cerebras:', error);
        // Opcional: avisar que deu erro ou ficar em silêncio
    }

});

client.initialize();
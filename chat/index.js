require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { OpenAI } = require('openai'); 

// configuração do cerebras
const cerebras = new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY, 
    baseURL: 'https://api.cerebras.ai/v1' // aponta para o servidor do Cerebras
});

//conectando ao whatsapp web e mantendo
const client = new Client({
    authStrategy: new LocalAuth()
});

// Trava de tempo: ignora o que veio antes de ligar o bot
const botStartTime = Math.floor(Date.now() / 1000);

// Função de delay 
const sleep = ms => new Promise(res => setTimeout(res, ms));

//qr code e verificacao de funcionamento
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message_create', async message => {
    //verificacoes de seguranca: mensagem enviada antes de bot online, de mim mesmo, de grupos e status.
    if (message.timestamp < botStartTime) return;
    if (message.fromMe) return;
    if (message.from.includes('@g.us')) return;
    if (message.isStatus || message.from === 'status@broadcast') return;

    try {
        const chat = await message.getChat();
        //verificacao extra grupo
        if (chat.isGroup) return;

        console.log(`📩 Mensagem de ${message.from}: ${message.body}`);
      
        // Marca como lida (Check azul)
        await chat.sendSeen(); 

        // Simula tempo de "leitura" (2 segundos)
        await sleep(2000); 
        
        // Mostra "digitando..."
        await chat.sendStateTyping();

        const completion = await cerebras.chat.completions.create({
            model: 'llama3.1-8b',
            messages: [
                {
                    role: 'system',
                    content: `Você é o 'DevBot' em teste, o assistente virtual da João's Dev. 
                    Seu objetivo é ser prestativo, técnico mas com linguagem simples. Sempre siga as diretrizes!
                    Não temos endereço, somente atendimento online.
                    Telefone: 4002-8922.
                    Email: teste@gmail.com.
                    
                    Diretrizes:
                    1. Você nao responde perguntas por si mesmo como: "como faço um site html", ou algo do tipo. Ao receber, diga que essa não é sua função.
                    2. Você entende o básico de programação.
                    3. Se o cliente descrever um problema, sugira que pode ser algo comum, mas SEMPRE recomende a análise de um dos nossos profissionais.
                    4. Nunca dê preços exatos, diga que ele deve fazer uma avaliação com um profissional.
                    5. Seja educado e use emojis de tecnologia.
                    6. Se perguntarem algo que não seja de programação, diga que você é focado em cuidar de tecnologia.
                    7. Caso te pergunte algo que não tenha resposta ou nao tenha certeza, não invente. Diga que vai analizar com os nossos desenvolvedores.
                    8. Evite mensagens muito longas. Os clientes gostam de algo direto.
                    9. Em caso de problemas técnicos se site, peça mais informações, como mensagem de erro no console, se fomos nós que fizemos o software, se houve alguma alteração no código fonte antes do erro, etc.`},
                { role: 'user', content: message.body }
            ],
        });

        const respostaIA = completion.choices[0].message.content;

        const tempoEscrita = Math.min(respostaIA.length * 50, 5000); // No máximo 5 segundos
        await sleep(tempoEscrita);

        //resposta
        await client.sendMessage(message.from, respostaIA);

    } catch (error) {
        console.error('Erro Cerebras:', error);
    }

});

client.initialize();
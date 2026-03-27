const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

//conectando ao whatsapp web e mantendo
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', () => {
    console.log('Client is ready!');
});

//gerar qr code
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('message_create', async message => {
    //if (message.fromMe) return;
    const msg = message.body.toLowerCase(); //ignora maiúsculas e minúsculas

// 2. Comandos iniciais (Gatilhos para o menu)
    if (msg === 'oi' || msg === 'olá' || msg === '!menu') {
        
        const saudacao = '🤖 *Olá! Eu sou o Bot do João.*\n\nComo posso te ajudar hoje?\n\n' +
                         '1️⃣ - Suporte Técnico\n' +
                         '2️⃣ - Informações de Vendas\n' +
                         '3️⃣ - Falar com Humano\n\n' +
                         '_Digite apenas o número da opção._';
        
        await client.sendMessage(message.from, saudacao);
    }

    // 3. Respostas baseadas na escolha do usuário
    else if (msg === '1') {
        await client.sendMessage(message.from, '🔧 *Suporte:* Nosso horário de atendimento técnico é das 08h às 18h. Qual o seu problema?');
    } 
    
    else if (msg === '2') {
        await client.sendMessage(message.from, '💰 *Vendas:* Acesse nosso catálogo em: https://meulink.com/produtos');
    } 
    
    else if (msg === '3') {
        await client.sendMessage(message.from, '👤 *Aguarde:* Vou notificar o João para vir falar com você em breve!');
    }
});

client.initialize();
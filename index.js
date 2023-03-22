// Inicialização das bibliotecas necessárias
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const PiMotor = require("pi-motor");
const { Board, Motor, IMU } = require('pi-motor');
const cv = require('opencv4nodejs');
const { parseString } = require("xml2js");
const cpu = require('windows-cpu');


// Configuração do servidor
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Inicialização dos motores e do acelerômetro
const board = new Board();
const motorEsquerda = new PiMotor.Stepper('STEPPER1'); 
const motorDireita = new PiMotor.Stepper('STEPPER2');
const imu = new PiMotor.IMU();


//obter informações sobre a CPU no Windows
const cpuInfo = cpu.cpuInfo();
console.log(cpuInfo);
const { Motor: MotorPi, IMU: PiIMU, Board: PiBoard } = process.platform === 'linux' ? require('pi-motor') : {};

// Constantes do algoritmo PID
const kp = 0.3;
const ki = 0.1;
const kd = 0.2;

// Variáveis do algoritmo PID
let lastError = 0;
let integral = 0;



// Definição das rotas
app.get('/', (req, res) => {
    res.send('Autopilot NodeJs Backend');
});

app.post('/api/autopilot', async (req, res) => {
    const comando = req.body.comando;

    switch (comando) {
        case 'frente':
            car.frente();
            break;
        case 'traz':
            car.traz();
            break;
        case 'esquerda':
            car.esquerda();
            break;
        case 'direita':
            car.direita();
            break;
        case 'parar':
            car.parar();
            break;
        case 'ultrapassagem':
            await identificarUltrapassagem();
            break;
        case 'estacionar':
            await estacionar();
            break;
        case 'curvaEsquerda':
            curva(-90);
            break;
        case 'curvaDireita':
            curva(90);
            break;
        default:
            console.log(`Comando inválido: ${comando}`);
            break;
    }

    res.send(`Comando ${comando} executado com sucesso.`);
    try {
        const comando = req.body.comando;
        // ...
        res.send(`Comando ${comando} executado com sucesso.`);
    } catch (error) {
        console.log(error);
        res.status(500).send('Erro interno do servidor.');
    }
});


// Identificação de ultrapassagem
async function identificarUltrapassagem() {
    // Captura uma imagem da câmera frontal
    const cap = new cv.VideoCapture(0);
    const frame = await cap.readAsync();

    // Detecta a posição dos carros na imagem
    const carClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALCAR_ALT2);
    const cars = await carClassifier.detectMultiScaleAsync(frame);

    // Verifica se existe um carro na frente
    const carInFront = cars.find(car => car.y > frame.rows * 0.5);

    // Se houver um carro na frente, faz a ultrapassagem
    if (carInFront) {
        car.esquerda();
        await sleep(2000); // Tempo para o carro mudar de faixa
        car.frente();
    }

    try {
        // ...
    } catch (error) {
        console.log(error);
    }
}

// Estacionamento do carro
async function estacionar() {
    car.parar(); // Para o carro
    await sleep(1000);
    car.traz(); // Move o carro para trás
    await sleep(2000);
    car.esquerda(); // Vira o volante para a esquerda
    await sleep(2000);
    car.parar(); // Para o carro novamente
}

// Fazer curvas
function curva(angulo) {
    car.curva(angulo);
}

// Função para aguardar um determinado tempo em milissegundos
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Pagar o pedágio usando a API do Sem Parar em XML
app.post("https://www.semparar.com.br/api/checkout/pub/orderForm", (req, res) => {
  const xml = req.body.xml;
  const data = {
    placa: 'ABC1234',
    valor: 5.99
    }; 
    try {
        const xml = req.body.xml;
        // ...
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).send('Erro interno do servidor.');
    }
    
  parseString(xml, async (err, result) => {
    const response = await axios.post(url, data, { headers });
    console.log(response.data);
    if (err) {
      console.error(err);
      res.status(500).send("Error parsing XML");
      return;
    }

    res.json(result);
  });
});


// Pagar o pedágio usando a API Json do Sem Parar
async function pagarPedagio() {
    const url = 'https://www.semparar.com.br/api/checkout/pub/orderForm';
    const data = {
        placa: 'ABC1234',
        valor: 5.99
    };
    const headers = {
        'Authorization': 'Bearer seu_token_aqui'
    };

    try {
        const response = await axios.post(url, data, { headers });
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
}
//Pagar o pedágio
app.post('/api/pagamento', async (req, res) => {
    try {
        await pagarPedagio();
        res.send('Pagamento realizado com sucesso.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Erro interno do servidor.');
    }
});

// Inicialização do servidor
const port = process.env.PORT || 3000;
if (isNaN(port)) {
    console.error(`Porta inválida: ${port}`);
    process.exit(1);
}
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

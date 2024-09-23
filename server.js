import express from 'express';
import amqp from 'amqplib';
import cors from 'cors';

//Instancierer en express server, så vi kan bruge den til at oprette endpoints
const app = express();

//Cors for at sikre, at vi kan modtage requests fra frontend
app.use(cors());

//Express.json() for at kunne modtage json objekter fra frontend
app.use(express.json());

//Opretter en let variabel channel, som bliver udfyldt senere, når vi forbinder til rabbitMQ
let channel;
const exchangeName = 'tourExchange';

//Funktion til at oprette forbindelse til rabbitmq
const connectRabbitMQ = async () => {
    //Benytter amqp library til at interagere med rabbitMQ
    const connection = await amqp.connect('amqp://localhost');
    //Opretter en channel på rabbitMQ
    channel = await connection.createChannel();
    //Bruger exchangeName variablen til at oprette en exchange på rabbitMQ
    await channel.assertExchange(exchangeName, 'topic', { durable: false });
}

connectRabbitMQ().catch(console.error);

//Opsætning af endpoint for at modtage tour objektet fra frontend og sende til rabbitMQ. 
app.post('/create-tour', async (req, res) => {
    console.log('Recieved tour request from frontend: ', req.body);

    //Tager fat i tour objektet fra request body fra frontend
    const tour = req.body;

    //Destructure isBooking, så vi ved hvilken routing key vi skal bruge
    const { isBooking } = tour;

    const routingKey = isBooking ? 'tour.booked' : 'tour.cancel';

    //Forsøger at sende tour objektet til rabbitMQ
    try {
        await channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(tour)));
        res.sendStatus(200);
    //ellers send status 500
    } catch (error) {
        console.log('Error sending tour to RabbitMQ', error);
        res.sendStatus(500); 
    }
});

app.listen(3001, () => console.log('Server running on port 3001'));

import express from 'express';
import amqp from 'amqplib';
import cors from 'cors';

//Instancierer en express server, så vi kan bruge den til at oprette endpoints
const app = express();

//Cors for at sikre, at jeg kan modtage requests fra frontend
app.use(cors());
app.use(express.json());

let channel;
const exchangeName = 'tourExchange';

const connectRabbitMQ = async () => {
    const connection = await amqp.connect('amqp://localhost');
    //Opretter en channel på rabbitMQ
    channel = await connection.createChannel();
    //Opretter en queue på rabbitMQ med navnet 'tourbookings'
    await channel.assertExchange(exchangeName, 'topic', { durable: false });
}

connectRabbitMQ().catch(console.error);

//Opsætning af endpoint for at modtage tour objektet fra frontend og sende til rabbitMQ. 
app.post('/create-tour', async (req, res) => {
    console.log('Recieved tour request from frontend: ', req.body);

    //Tager fat i tour objektet fra request body fra frontend
    const tour = req.body;

    const { isBooking } = tour;

    const routingKey = isBooking ? 'tour.booking' : 'tour.cancel';
    console.log('Routing Key: ', routingKey)
    
    try {
        await channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(tour)));
        res.sendStatus(200);
    } catch (error) {
        console.log('Error sending tour to RabbitMQ', error);
        res.sendStatus(500); 
    }
});

app.listen(3001, () => console.log('Server running on port 3001'));

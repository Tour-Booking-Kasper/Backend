import express from 'express';
import amqp from 'amqplib';

//Instancierer en express server, så vi kan bruge den til at oprette endpoints
const app = express();

//Opret forbindelse til RabbitMQ
let channel;
const connectRabbitMQ = async () => {
    const connection = await amqp.connect('amqp://rabbitmq');
    //Opretter en channel på rabbitMQ
    channel = await connection.createChannel();
    //Opretter en queue på rabbitMQ med navnet 'tourbookings'
    await channel.assertQueue('tourbookings');
}

connectRabbitMQ().catch(console.error);

//Opsætning af endpoint for at modtage tour objektet fra frontend og sende til rabbitMQ. 
app.post('/create-tour', async (req, res) => {
    //Tager fat i tour objektet fra request body fra frontend
    const tour = req.body;

    //Forsøg at omdanne denne til en json string og send den til rabbitMQ, ellers send en fejlmeddelelse til frontend
    try {
        await channel.sendToQueue('tourbookings', Buffer.from(JSON.stringify(tour)));
        res.sendStatus(200).send('Tour successfully sent to RabbitMQ');
    } catch (error) {
        console.log('Error sending tour to RabbitMQ', error);
        res.status(500).send('Error sending tour to RabbitMQ');
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));

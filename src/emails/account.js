const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jdrc2908@gmail.com',
        subject: 'Welcome to the app',
        text: `Hi ${name}, we hope you enjoy our application.`
    })
}

const sendByeByeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jdrc2908@gmail.com',
        subject: `We're sorry to see you go`,
        text: `Hey ${name}, we're sorry to see you go, is there anything we could have done to made you stay?`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendByeByeEmail
}
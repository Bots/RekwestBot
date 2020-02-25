const express = require('express')
const mongodb = require('mongodb')

const router = express.Router()

// Get Posts 
router.get('/', async (req, res) => {
    const posts = await loadPostCollection()
    res.send(await posts.find({}).toArray())
})

// Add Posts
router.post('/', async (req, res) => {
    const posts = await loadPostCollection()
    await posts.insertOne({
        text: req.body.text,
        createdAt: new Date()
    })
    res.status(201).send()
})

// Delete Posts 
router.delete('/:id', async (req, res) => {
    const posts = await loadPostCollection()
    await posts.deleteOne({_id: new mongodb.ObjectID(req.params.id)})
    res.status(200).send()
})

async function loadPostCollection() {
    const client = await mongodb.MongoClient.connect
    ('mongodb+srv://botsone:pomeroys@cluster0-t06fs.mongodb.net/test?retryWrites=true&w=majority', {
        useNewUrlParser: true
    })

    return client.db('vue_express').collection('posts')
}

module.exports = router
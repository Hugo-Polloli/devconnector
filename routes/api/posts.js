const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');

// Model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// Validation
const validatePostInput = require('../../validation/post');
const validateCommentInput = require('../../validation/comment');

// @route  GET api/posts/test
// @desc   Tests posts route
// @access Public
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }));

// @route  GET api/posts
// @desc   Get posts
// @access Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => {
      res.json(posts);
    })
    .catch(err => res.status(404).json({ nopost: 'No posts found' }));
});

// @route  GET api/posts/:id
// @desc   Get post by id
// @access Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      res.json(post);
    })
    .catch(err =>
      res.status(404).json({ nopost: 'No post found for this id' })
    );
});

// @route  POST api/posts
// @desc   Create a post
// @access Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.user.name,
      avatar: req.user.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route  DELETE api/posts/:id
// @desc   Delete a post
// @access Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findOneAndDelete({ user: req.user.id, _id: req.params.id })
      .then(post => {
        if (!post) {
          return res
            .status(404)
            .json({ nopost: 'No post found matching both ID and user' });
        }
        res.json({ success: true });
      })
      .catch(err => res.status(404).json({ nopost: 'Post not found' }));
  }
);

// @route  POST api/posts/like/:id
// @desc   Like/Unlike a post
// @access Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        const indexOfUser = post.likes.findIndex(
          like => like.user.toString() === req.user.id
        );
        indexOfUser === -1
          ? post.likes.unshift({ user: req.user.id })
          : post.likes.splice(indexOfUser, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

// @route  POST api/posts/comment/:id
// @desc   Add comment a post
// @access Private
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateCommentInput(req.body);

    // Check validation
    if (!isValid) {
      // Return errors
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = Object.assign(
          _.pick(req.body, ['text', 'name', 'avatar', 'date']),
          { user: req.user.id }
        );

        // Add to comments array
        post.comments.unshift(newComment);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

// @route  Delete api/posts/comment/:id/:comment_id
// @desc   Delete a comment from a post
// @access Private
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check to see if the comment exists & if user is authorized
        const commentIndex = post.comments.findIndex(
          comment =>
            comment._id.toString() === req.params.comment_id &&
            comment.user.toString() === req.user.id
        );

        if (commentIndex === -1) {
          return res.status(401).json({
            nocomment: "Comment doesn't exist or you are not its author"
          });
        }

        // Remove the comment from the comments array
        post.comments.splice(commentIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(() => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

module.exports = router;

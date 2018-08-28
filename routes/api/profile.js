const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');

// Load validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load Profile model
const Profile = require('../../models/Profile');
// Load user Profile
const User = require('../../models/User');

// @route  GET api/profile/test
// @desc   Tests profile route
// @access Public
router.get('/test', (req, res) => res.json({ msg: 'Profile Works' }));

// @route  GET api/profile
// @desc   Get current user's profile
// @access Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route  GET api/profile/all
// @desc   Get all profiles
// @access Public
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles || profiles.length === 0) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profile: 'There are no profiles' }));
});

// @route  GET api/profile/handle/:handle
// @desc   Get profile by handle
// @access Public
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route  GET api/profile/user/:user_id
// @desc   Get profile by user ID
// @access Public
router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: 'There is no profile for this user' })
    );
});

// @route  POST api/profile
// @desc   Create or edit user's profile
// @access Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check validation
    if (!isValid) {
      // Return errors
      return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    profileFields.social = {};

    const standardFields = [
      'handle',
      'company',
      'website',
      'location',
      'bio',
      'status',
      'githubUsername'
    ];

    const socialFields = Object.keys(Profile.schema.tree.social);

    for (key of Object.keys(req.body)) {
      if (standardFields.includes(key) && req.body[key]) {
        profileFields[key] = req.body[key];
      } else if (socialFields.includes(key) && req.body[key]) {
        profileFields.social[key] = req.body[key];
      } else if (key === 'skills' && typeof req.body[key] !== 'undefined') {
        profileFields[key] = req.body[key].split(',');
      }
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => res.json(profile));
      } else {
        // Create

        // Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = 'That handle already exists';
            return res.status(400).json(errors);
          }

          // Save Profile
          new Profile(profileFields).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

// @route  POST api/profile/experience
// @desc   Add experience to profile
// @access Private
router.post(
  '/experience',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check validation
    if (!isValid) {
      // Return errors
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = _.pick(req.body, [
        'title',
        'company',
        'location',
        'from',
        'to',
        'current',
        'description'
      ]);

      // Add to experience array
      profile.experience.unshift(newExp);

      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route  POST api/profile/education
// @desc   Add education to profile
// @access Private
router.post(
  '/education',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check validation
    if (!isValid) {
      // Return errors
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = _.pick(req.body, [
        'school',
        'degree',
        'fieldofstudy',
        'from',
        'to',
        'current',
        'description'
      ]);

      // Add to education array
      profile.education.unshift(newEdu);

      profile.save().then(profile => res.json(profile));
    });
  }
);

module.exports = router;

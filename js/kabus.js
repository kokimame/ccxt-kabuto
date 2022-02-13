'use strict';

const Exchange = require ('./base/Exchange');

module.exports = class kabus extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'kabus',
            'urls': {
                'logo': 'https://pbs.twimg.com/profile_images/1476235905375813633/-jRNbwhv_400x400.jpg',
                'api': 'https://api.kabus',
                'www': 'https://twitter.com/KabutoTheBot',
                'doc': 'https://twitter.com/KabutoTheBot',
            },
        });
    }
};

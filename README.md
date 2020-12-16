## About the project

It's a simple standalone script for scrapping svg from popular search engines. Right now I have no plans to make it a package due to puppeteer usage.

### Why I created this ?

Recently I attended [10Clouds hackaton](https://10clouds.com/blog/codeability-hackathon-projects). My backup plan was to create a [roadmaps](https://github.com/orsanawwad/awesome-roadmaps) enchancer to make them accesible for disabled people. To speedup future development I created this simple tool. It's goal was to provide svg image/icon for every category on a map.

### Roadmap

1.  Filter output <done>
2.  Wait longer for yandex load <done>
    1. Main method returns logs and result <done>
3.  React icon repo scrap
    1. Way of choosing icon
    2. Scrapping or getting it as eval()
4.  Saving result to json file, and searching answers in it
    1. choose direcotry for json file --> /var/tmp:Linux
    2. read file if exist, if not create it
    3. create object from query and result and expand existing json
    4. save result
    5. make function for checking json before scrapping (or Promise.race it )

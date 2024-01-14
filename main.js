"use strict";


class UnsplashService {
    #clientId;

    constructor(clientId) {
        this.#clientId = clientId;
    }

    async getRandomImage() {
        const response = await fetch(`https://api.unsplash.com/photos/random/?client_id=${this.#clientId}`);
        if(!response.ok)
            throw new Error(response.statusText);
        return await response.text();
    }
}


class ImageInfoWrapper {
    #imageInfo;

    constructor(unsplashImageInfo) {
        this.#imageInfo = JSON.parse(unsplashImageInfo);
    }

    get imageInfo() {
        return JSON.stringify(this.#imageInfo);
    }

    get isLike() {
        return this.#imageInfo.isLike ?? false;
    }

    set isLike(flag) {
        return this.#imageInfo.isLike = flag;
    }

    get src() {
        return this.#imageInfo.urls.small;
    }

    get authorName() {
        return this.#imageInfo.user.name;
    }

    get authorBio() {
        return this.#imageInfo.user.bio;
    }

    get authorLocation() {
        return this.#imageInfo.user.location;
    }
}


class DailyImageManager {
    #unsplashService;

    constructor(unsplashService) {
        this.#unsplashService = unsplashService;
    }

    async getImage(date) {
        let img = this.#tryGetImageFromStorage(date);
        if(!img) {
            img = await this.#unsplashService.getRandomImage();
            const nowDate = date.toDateString();
            localStorage.setItem(nowDate, img);
        }
        return new ImageInfoWrapper(img);
    }

    setLike(date) {
        const img = this.#tryGetImageFromStorage(date, true);
        const imgInfo = new ImageInfoWrapper(img);
        imgInfo.isLike = true;
        localStorage.setItem(date.toDateString(), imgInfo.imageInfo);
    }

    #tryGetImageFromStorage(date, error = false) {
        const dateStr = date.toDateString();
        const image = localStorage.getItem(dateStr);
        if(error && !image)
            throw new Error("Image not found");
        return image;
    }
}


class RandomImageApp {
    #imageManager;
    #curImage;
    #curDate = new Date();

    constructor(dailyImageManager) {
        this.#imageManager = dailyImageManager;
    }

    create() {
        this.#curDate.setTime(this.#curDate.getTime() - this.#curDate.getTime() % 86400000);
        document.querySelector(".history__prev").onclick = this.#onPrevClick.bind(this);
        document.querySelector(".history__next").onclick = this.#onNextClick.bind(this);
        document.querySelector(".random__like").onclick = this.#onLikeClick.bind(this);
        this.#changeDayImage();
    }

    #changeDayImage() {
        this.#imageManager.getImage(this.#curDate)
            .then(image => {
                this.#curImage = image;
                this.#refresh();
            })
            .catch(error => console.log(error));
    }

    #setDayImage() {
        document.querySelector(".random__img").setAttribute("src", this.#curImage.src);
    }

    #setAuthorInfo() {
        document.querySelector(".author__name span").textContent = this.#curImage.authorName;
        document.querySelector(".author__loc span").textContent = this.#curImage.authorLocation;
        document.querySelector(".author__bio").textContent = this.#curImage.authorBio;
    }

    #setCurDate() {
        document.querySelector(".history__cur-date").textContent = this.#curDate.toDateString();
    }

    #setPrevDate() {
        const prevDate = new Date(this.#curDate.getTime() - 86400000);
        document.querySelector(".history__prev-date").textContent = prevDate.toDateString();
    }

    #setNextDate() {
        const nextDate = new Date(this.#curDate.getTime() + 86400000);
        if(nextDate.getTime() > Date.now())
            document.querySelector(".history__next").classList.add("history__next_off");
        else
            document.querySelector(".history__next").classList.remove("history__next_off");
        document.querySelector(".history__next-date").textContent = nextDate.toDateString();
    }

    #setLike() {
        if(this.#curImage.isLike)
            document.querySelector(".random__like").classList.add("random__like_active");
        else
            document.querySelector(".random__like").classList.remove("random__like_active");
    }

    #refresh() {
        this.#setDayImage();
        this.#setAuthorInfo();
        this.#setCurDate();
        this.#setPrevDate();
        this.#setNextDate();
        this.#setLike();
    }

    #onPrevClick() {
        this.#curDate.setTime(this.#curDate.getTime() - 86400000);
        this.#changeDayImage();
    }

    #onNextClick() {
        this.#curDate.setTime(this.#curDate.getTime() + 86400000);
        this.#changeDayImage();
    }

    #onLikeClick(e) {
        const classList = e.currentTarget.classList;
        if(classList.contains("random__like_active")) return;
        classList.add("random__like_active");
        this.#imageManager.setLike(this.#curDate);
    }
}


const unsplashService = new UnsplashService("fCGbOn966kV8BgnspvL6i1RJpU8NSOIEpXPi6pGh2SY");
const dailyImageManager = new DailyImageManager(unsplashService);
const app = new RandomImageApp(dailyImageManager);
app.create();

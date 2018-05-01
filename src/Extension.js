import React, { Component } from 'react';
import $ from 'jquery';
import './Extension.css';

/* global chrome */

const GLOBALS = {
    preface : "jk--chrome--extension"
}

class Extension extends Component {
    constructor() {
        super();
        this.state = {
            processing : true
        };
    }
    componentDidMount() {   
        this.setState({
            extHighlighter : this.initBody(),
            target : null,
            processing : false
        });
        this.initUI();
    }
    
    initBody = () => {
        const init = document.body; 
        init.id = `${GLOBALS.preface}--body`;
        $(init).wrapInner( `<div class='${GLOBALS.preface}--wrapper'></div>` );
        // keep the extension "outside" of the content wrapper
        $(`#${GLOBALS.preface}`).insertBefore($(`.${GLOBALS.preface}wrapper`));
        const extHighlighter = document.createElement('a');
        extHighlighter.id = `${GLOBALS.preface}--target`;
        
        if (init) init.prepend(extHighlighter);
        return extHighlighter;
    }
    initUI = () => {
        $(document).on("mousemove", this.target);
        $(`#${GLOBALS.preface}--body a, #${GLOBALS.preface}--body button`).on("click", function(e){
            e.preventDefault();
        });
        
        $(`.${GLOBALS.preface}--wrapper`).on("click", function(e) {
            e.preventDefault();
            if (!e.target.classList.contains("jk--ext--ignore") && !this.state.processing) {
                this.setState({
                    img : false,
                    processing : true
                });
                $(`#${GLOBALS.preface}--body`).addClass("processing");
                $('html, body').animate({
                    scrollTop: $(e.target).offset().top - 88
                }, 150);
                setTimeout(function(){
                    if (this.state.targetHeight > window.innerHeight) {
                        this.setState({
                            pageXOffset : 0,
                            pageYOffset : 0
                        });
                        this.captureFullpage(e.target);
                    } else {
                        this.setState({
                            pageXOffset : window.pageXOffset,
                            pageYOffset : window.pageYOffset
                        });
                        this.capture(e.target);
                    }
                }.bind(this), 260);
            }
        }.bind(this));
    }
    target = (e) => {
        if (this.state.processing)
            return;
            
        if (e.target.id.indexOf('selector') !== -1 
            || e.target.tagName === "BODY" 
            || e.target.tagName === "HTML" 
            || e.target.tagName === "SVG"
            || e.target.classList.contains("jk--ext--ignore")) return;
        
        let $target = $(e.target);
                         
        const   classes = String(e.target.classList);
        
        this.setState({
            target : e.target,
            targetLabel : (classes.length > 0 ) ? e.target.nodeName + "." + classes.split(" ").join(".") : e.target.nodeName,
            targetHeight : $target.outerHeight(),
            targetWidth  : $target.outerWidth(),
            targetTop : $target.offset().top,
            targetLeft : $target.offset().left
        });
        
        $(this.state.extHighlighter).css({
            top : $target.offset().top,
            left : $target.offset().left,
            width : $target.outerWidth(),
            height : $target.outerHeight(),
            visibility : this.state.processing ? "hidden" : "visible"
        }).attr({"data-label" : this.state.targetLabel});
    }
    pixelRatio = (context) => {
        let devicePixelRatio = window.devicePixelRatio || 1,
            backingStoreRatio = context.webkitBackingStorePixelRatio ||
                            context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStoreRatio;  
        
    }
    canvasDrawImage = (canvas, context, partialImage, sourceX, sourceY, sourceWidth, sourceHeight, destWidth, destHeight, destX, destY) => {
        sourceX = sourceX *  this.pixelRatio(context);
        sourceY = sourceY *  this.pixelRatio(context);
        sourceWidth = sourceWidth  *  this.pixelRatio(context);
        sourceHeight = sourceHeight *  this.pixelRatio(context);
        destWidth = destWidth *  this.pixelRatio(context);
        destHeight = destHeight *  this.pixelRatio(context);
        destX = destX *  this.pixelRatio(context);
        destY = destY *  this.pixelRatio(context);

        context.drawImage(partialImage, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        return canvas.toDataURL("image/png");
    }
    crop = (screenshot) => {
        let partialImage = new Image(),
            canvas = document.createElement("canvas"),
            context = canvas.getContext("2d");
        
        canvas.width = this.state.targetWidth * this.pixelRatio(context);
        canvas.height = this.state.targetHeight * this.pixelRatio(context); 
        partialImage.onload = () => {
            setTimeout(function(){
                this.setState({
                    img : this.canvasDrawImage(
                        canvas,
                        context,
                        partialImage,
                        this.state.targetLeft - this.state.pageXOffset,
                        this.state.targetTop - this.state.pageYOffset,
                        this.state.targetWidth,
                        this.state.targetHeight,
                        this.state.targetWidth,
                        this.state.targetHeight,
                        0,
                        0),
                    processing : false
                });
                $(`#${GLOBALS.preface}--body`).removeClass("processing");
            }.bind(this), 150);
         
        };
        partialImage.src = screenshot;

    };
    captureFullpage = (target) => {
        // everything is not in view, vertically
        this.setState({
            img : null,
            processing : true
        });
        let _scroll = (px) => {
            window.scrollTo(0,px);
        }
        _scroll(0);
        
        let _distance = 0,
            _height = this.state.targetHeight,
            partialImage = new Image(),
            canvas = document.createElement("canvas"),
            context = canvas.getContext("2d");
            
            canvas.width = window.innerWidth *  this.pixelRatio(context);
            canvas.height = this.state.targetHeight *  this.pixelRatio(context); 
            
        
        let addToCanvas = (Ypx) => {
            let _offset = 0;
            
            if (Ypx > this.state.targetHeight) {
                // tidy up and out, yo
                this.crop(this.state.img);
                return;
            }
            
            chrome.runtime.sendMessage({msg: "capture"}, function(response) {
                let screenshot = response.imgSrc;
                
                partialImage.onload = () => {
                    this.setState({
                        img : this.canvasDrawImage(
                            canvas,
                            context,
                            partialImage,
                            // sourceX, sourceY, sourceWidth, sourceHeight, destWidth, destHeight, destX, destY
                            0,
                            0,
                            //(this.state.targetHeight - Ypx < window.innerHeight) ? this.state.targetHeight - Ypx : 0,
                            window.innerWidth,
                            window.innerHeight,
                            window.innerWidth,
                            window.innerHeight,
                            0,
                            (this.state.targetHeight - Ypx < window.innerHeight) ? this.state.targetHeight - window.innerHeight : Ypx),
                    });
                    _scroll(Ypx + window.innerHeight);
                    setTimeout(function(){
                        addToCanvas(Ypx + window.innerHeight);
                    }, 1000);
                };
                
                partialImage.src = screenshot;
                
            }.bind(this));
        }
        setTimeout(function(){
            addToCanvas(0);
        }, 1000);
        
        
        
    };
    capture = (target) => {
        // everything is "in view"  
        chrome.runtime.sendMessage({msg: "capture"}, function(response) {
            this.crop(response.imgSrc);
        }.bind(this));
    }
    handleSaveFile = (e) => {
        e.preventDefault(); 
        var link = document.createElement('a');
        link.download = document.title + '.png';
        link.href = this.state.img;
        link.click();
    }
    handleRemove = (e) => {
        e.preventDefault(); 
        e.stopPropagation(); 
        this.setState({ img : null });
    }
    render() {
        let _currentImg = this.state.img,
            _processing = this.state.processing;

        return (
            <div id="ext--dialogue" className="jk--ext--ignore">
                { (_currentImg && !_processing) &&
                    <div>
                        <div className="current"><img src={ _currentImg } width="100%" className="jk--ext--ignore"/></div>
                        <div>
                            <div className={`${GLOBALS.preface}--button jk--ext--ignore`} onClick={(e) => this.handleRemove(e)}>Clear Image</div> 
                            <div className={`${GLOBALS.preface}--button jk--ext--ignore`} onClick={(e) => this.handleSaveFile(e)}>download</div>
                        </div>
                    </div>
                }
                { (!_processing && !_currentImg) && 
                    <div className="processing--msg jk--ext--ignore">
                        <p><img src="http://iamhavingthis.com/logo.svg"/>
                        Choose any DOM element to get a PNG</p>
                    </div> 
                }
                { _processing && <div className="processing--msg jk--ext--ignore"><div></div></div> }
            </div>
        );
    }
}

export default Extension;

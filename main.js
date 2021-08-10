// ==UserScript==
// @name         Eudravigilance Data Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       U
// @include      https://dap.ema.europa.eu/analytics/*
// @icon         https://www.google.com/s2/favicons?domain=europa.eu
// @grant        none
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @grant        window.onurlchange
// @grant        GM_addElement
// @run-at       document-end
// ==/UserScript==

/*
 * The MIT License (MIT)
 *
 * Copyright © 2021 U
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the “Software”),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*
 * The goal of this script is to extract individual information from
 * eudravigilance website.
 *
 *   1. Go to https://www.adrreports.eu/fr/search_subst.html#
 *   2. Find your drug by name
 *   2.1. COVID-19 MRNA VACCINE MODERNA (CX-024414)
 *   2.2. COVID-19 MRNA VACCINE PFIZER-BIONTECH (TOZINAMERAN)
 *   2.3. COVID-19 VACCINE ASTRAZENECA (CHADOX1 NCOV-19)
 *   2.4. COVID-19 VACCINE JANSSEN (AD26.COV2.S)
 *   3. Click on it
 *   4. A "board" should be available on the bottom of the page
 *
 * Info:
 *   - https://blog.thevirtuoid.com/2020/07/22/using-xpath-in-javascript/
 *   - https://gist.github.com/simondahla/0c324ba8e6ed36055787
 *   - https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 *
 * Todo:
 *   - Use Observer instead of polling for data update
 *   - Add an "auto" mode to automatically extract all data from the page
 *   - Add "export" button on all pages
 *   - Add "download" button on all pages
 *   - Propose export in ODS and/or XSLS format
 *   - Add total row or column
 *   - Add dates
 *   - Use a more standard data-structure than the one actually used
 *   - Design small functions to extract information one by one
 *   - Create a strong abstraction between the site and the code
 *   - reverse engineering the way information are requested
 *   - create a fully new interface based on the raw requests
 *   - add tests and comments
 *
 * Note:
 *   - Author is not javascript developer. This code is poorly designed
 */

(function() {
    'use strict';
    let debug = false;
    let delay = 3000;
    let separator = ";";
    var full_buffer = {
    };

    create_board();
    setInterval(_update, delay);

    function _debug(message) {
        if (debug === true) {
          console.log("debug: " + message);
        }
    }

    function _update() {
        update_full_buffer();
        // update_total();
        update_board();
    }

    function _add_value(column, value) {
        return {
            column: value
        }
    }

    function list_reactions() {
        let xpath = '//*[@id="saw_544161_9_1"]';
        let path = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let element = path.iterateNext();
        element.click();
    }

    function get_list_of_reaction() {
        let xpath = '/html/body/div[12]/div/div[2]/div';
        let path = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let element = path.iterateNext();
        let element2 = path.iterateNext();
        console.log(element2);
    }

    function _zip(array1, array2) {
        var buf = [];
        var i = 0;
        if (array1.length == array2.length) {
            for (i=0; i<array1.length; i++) {
                buf.push([array1[i], array2[i]]);
            }
            return buf;
        }
    }

    function extract_age_group_sex() {
        let xpath = '/html/body/div[7]/div/table[1]/tbody/tr[1]/td[2]/div/table[1]/tbody/tr/td[2]/div[1]/div[2]/table[2]/tbody/tr/td[3]/div/table/tbody/tr[3]/td/div/div[3]/table/tbody/tr/td/div/table/tbody/tr/td/div/table/tbody/tr/td/div/div/div/div[1]/table/tbody/tr/td/table/tbody/tr/td/table/tbody/tr/td/div/';
    }

    function extract_report_group() {
        let xpath = '/html/body/div[7]/div/table[1]/tbody/tr[1]/td[2]/div/table[1]/tbody/tr/td[2]/div[1]/div[2]/table[2]/tbody/tr/td[3]/div/table/tbody/tr[5]/td/div/div[3]/table/tbody/tr/td/div/table/tbody/tr/td/div/table/tbody/tr/td/div/div/div/div[1]/table/tbody/tr/td/div/';
    }

    function extract_outcome() {
        let xpath = '/html/body/div[7]/div/table[1]/tbody/tr[1]/td[2]/div/table[1]/tbody/tr/td[2]/div[1]/div[2]/table[2]/tbody/tr/td[3]/div/table/tbody/tr[7]/td/div/div[3]/table/tbody/tr/td/div/table/tbody/tr/td/div/table/tbody/tr/td/div/div/div/div[1]/table/tbody/tr/td/div';
        let path = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        let element = path.iterateNext();
        var content = element.getElementsByTagName("text");
        var buf = [];
        var i=0;
        var titles = [];
        var values = [];

        for (i=2; i<9; i++) {
            titles.push(JSON.stringify(content[i].textContent));
        }
        for (i=(content.length-1); i>(content.length-8); i--) {
            values.push(Number(content[i].textContent.replaceAll(/,/g, "")));
        }
        return [
            [JSON.stringify("Reaction Groups")].concat(titles),
            [extract_title()].concat(values.reverse()),
        ]
        // return _zip(titles, values.reverse());
    }

    function extract_title() {
        let xpath = '/html/body/div[7]/div/table[1]/tbody/tr[1]/td[2]/div/table[1]/tbody/tr/td[2]/div[1]/div[2]/table[2]/tbody/tr/td[1]/div/table/tbody/tr[2]/td/div/div[3]/table/tbody/tr/td/div/table/tbody/tr/td/div/table/tbody/tr[2]/td/div/div/div/table/tbody/tr/td/div/form/div/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr[1]/td/table/tbody/tr[2]/td/span/span/div/div';
        var path = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var element = path.iterateNext();
        var title = element.firstChild.title;
        return JSON.stringify(title);
    }

    // create a new report by extracting title and outcome
    function create_report() {
        let buffer = [];
        let title = extract_title();
        let outcome = extract_outcome();
        let titles = outcome[0].join(separator);
        let outcomes = outcome[1].join(separator);
        let ret = [
            titles,
            outcomes
        ].join("\n");
        _debug(ret);
        return ret;
    }

    function create_new_report() {
        var buf = [];
        var counter = 0;
        for(const k in full_buffer) {
            if (counter === 0) {
                buf.push(full_buffer[k][0].join(separator));
            }
            buf.push(full_buffer[k][1].join(separator));
            counter+=1;
        }
        let ret = buf.join("\n");
        _debug(ret);
        return ret;
    }

    // create a new board
    function create_board() {
        let d = document.createElement("div");
        d.id = "board";
        d.style.width = "100%";
        d.style.position = "absolute";
        d.style.background = "white";
        d.style.color = "black";
        d.style.padding = "10px 10px 10px 10px";
        d.textContent = "Loading board...";
        document.body.appendChild(d);
    }

    function update_board() {
        let board = document.getElementById("board");
        board.innerHTML = "<pre>" + create_new_report() + "</pre>";
        board.innerHTML = board.innerHTML + "<hr>";
        board.innerHTML = board.innerHTML + JSON.stringify(full_buffer);
    }

    function update_full_buffer() {
        let title = extract_title();
        if (full_buffer[title] === undefined) {
            let outcome = extract_outcome();
            full_buffer[title] = outcome;
        }
    }

    function update_total() {
        var buf = ['total'];
        var i=1;
        for(i=1; i<9; i++) {
            var count=0;
            for(const k in full_buffer) {
                if (k != "total") {
                    count += full_buffer[k][i];
                }
            }
            buf.push(count);
        }
        full_buffer.total = buf;
    }
})();

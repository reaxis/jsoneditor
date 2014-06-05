// Copyright © 2014 Hraban Luyat <hraban@0brg.net>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
)

var config map[string]interface{}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		err := json.NewDecoder(r.Body).Decode(&config)
		r.Body.Close()
		if err != nil {
			http.Error(w, "Failed to unserialize params: "+err.Error(), 400)
			return
		}
		return
	} else {
		w.Header().Set("content-type", "application/json")
		json.NewEncoder(w).Encode(config)
		return
	}
}

func main() {
	addr := flag.String("l", "localhost:8181", "listen address")
	var root string
	flag.StringVar(&root, "root", "", "(optional) root dir for web requests")
	flag.Parse()
	if root == "" {
		var err error
		root, err = os.Getwd()
		if err != nil {
			log.Fatal("Failed to determine root directory of executable:", err)
		}
	}
	http.HandleFunc("/config", handleConfig)
	http.Handle("/", http.FileServer(http.Dir(root+"/static/")))
	log.Print("Starting websocket groupchat server on ", *addr)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

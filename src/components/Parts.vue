<template>
  <v-container>
    <v-row class="my-2">
      <v-col
        v-for="(part, index) in items"
        :key="index"
        cols="12"
        sm="6"
        md="6"
        lg="4"
      >
        <v-card
          class="mx-auto my-3"
          max-width="400"
          outlined
          v-if="part.payload.inputs.name"
        >
          <v-img
            v-if="!preview.find(x => x.txnId === part.id).show3d"
            class="white--text"
            height="200px"
            style="text-shadow: 0px 2px 2px rgba(0,0,0,1);"
            :src="preview.find(x => x.txnId === part.id).src"
            gradient="to top, rgba(0,0,0,0), rgba(0,0,0,0.5)"
          >
            <v-card-title class="align-end fill-height">
                <span class="ellipsis" style="margin-top: 143px">{{part.payload.inputs.name}}</span>  
              <div class="flex-grow-1"></div>
              <v-progress-circular
                v-if="preview.find(x => x.txnId === part.id).loading"
                style="right: 16px; top: 16px; position: absolute;"
                indeterminate
                color="white"
                size="26"
              ></v-progress-circular>
              <v-icon v-else :disabled="loading" class="mb-1" style="right: 16px; top: 16px; position: absolute;"  @click="lookupFile(part.id, part.payload.inputs._bundleHash)">mdi-axis-arrow</v-icon>
            </v-card-title>
          </v-img>

          <div v-else>
            <model-stl style="height: 200px !important;" class="graph" :backgroundAlpha="backgroundAlpha" :src="cache.peek(part.payload.inputs._bundleHash)"></model-stl>

            <v-card-title class="align-end fill-height" style="margin-top: -56px;">
               <span class="ellipsis">{{part.payload.inputs.name}}</span>  
            </v-card-title>

            <v-icon style="right: 16px; top: 16px; position: absolute;" @click="openFullscreen(part.payload.inputs._bundleHash)">mdi-fullscreen</v-icon>
          </div>

          <v-card-text>
            <div>
              <div><strong>IPFS Hash: </strong>
                <span class="flex-grow-1"></span>
                 <v-icon small @click="getFile(part.id, part.payload.inputs._bundleHash, true)">mdi-cloud-download</v-icon>
              </div>
              <span class="text--primary">
                <small>{{part.payload.inputs._bundleHash}}</small>
              </span>
            </div>
            <div class="mt-1">
                <strong>Transaction Hash: </strong>
                <span v-if="part.transaction_hash">
                  <small class="text--primary">{{part.transaction_hash}}</small>
                </span>
                <span v-else>
                  N/A
                  <br>
                  <br>
                  <br>
                </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-btn
      color="primary"
      dark
      fixed
      bottom
      right
      fab
      @click="dialog = true"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <v-dialog v-model="fullscreen" persistent fullscreen hide-overlay transition="scale-transition" origin="center center">
      <v-card>
        <v-toolbar dark top fixed :elevation="0" color="primary">
          <v-btn icon dark @click="fullscreen = false">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title>Fullscreen</v-toolbar-title>
          <div class="flex-grow-1"></div>
        </v-toolbar>
        <model-stl style="height: 100% !important;" :backgroundAlpha="backgroundAlpha" :src="fullscreenGraph"></model-stl>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog" persistent fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark top fixed :elevation="0" color="primary">
          <v-btn icon dark @click="dialog = false">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title>New Transaction</v-toolbar-title>
          <div class="flex-grow-1"></div>
          <v-toolbar-items>
            <v-btn dark text :disabled="!valid || !address" @click="takeSnapshot()">Post</v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-card     
          class="mx-auto"
          dark>
          <v-card-title>
            <v-btn
              @click="show = !show"
              text
              v-if="walletProgress == 100"
            >
              <v-icon left>mdi-wallet</v-icon> 
              <div>Wallet</div>
              <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
            <div v-else> 
              <v-btn text disabled>
                <v-progress-circular
                  :value="walletProgress"
                  color="light-blue"
                  width="2"
                  size="24"
                  class="mr-2"
                >
                  <small><small> {{ walletProgress }}</small></small>
                </v-progress-circular>
                <small> {{walletStatus}} Wallet</small>
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <div>Network: {{simba ? simba.metadata.network : 'Checking...'}}</div>
            <div>Address: {{address ? address : 'Checking...'}}</div>
          </v-card-text>

          <v-expand-transition>
            <div v-show="show" class="mx-4 mb-2">
              <small>
                <div>Seed: <strong>{{seed}}</strong></div>
              </small>
            </div>
          </v-expand-transition>
          <v-divider></v-divider>
        </v-card>

        <v-card class="elevation-0">
          <v-form 
            ref="form" 
            v-model="valid" 
          >
            <v-card-text>
              <v-text-field
                v-model="name"
                label="Name"
                prepend-icon="mdi-card-text-outline"
                :rules="rules"
              ></v-text-field>

              <v-file-input
                :rules="rules"
                accept=".stl"
                show-size
                v-model="stlFile"
                placeholder="Select your file"
                prepend-icon="mdi-printer-3d"
                label="STL File"
              ></v-file-input>

              <v-row
                align="center"
                justify="center"
              >
                <model-stl v-if="stlFile" ref="model" style="height: 150px !important; width: 300px !important;" class="graph" :controllable="controllable" :glOptions="{ preserveDrawingBuffer: true }" :backgroundAlpha="backgroundAlpha" :src="snapshot"></model-stl>
              </v-row>
            </v-card-text>
          </v-form>
        </v-card>
      </v-card>

      <v-overlay :value="postingTxn" color="black" opacity="0.8">
        <h1>
          <v-progress-circular class="mr-2 mb-2" indeterminate size="32"></v-progress-circular>
          Posting Transaction...
        </h1>
      </v-overlay>

    </v-dialog>


    <v-snackbar
      v-model="snackbar"
      bottom
      left
    >
      {{ text }}
      <v-icon @click="snackbar = false">mdi-close</v-icon>
    </v-snackbar>

    <v-overlay :value="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script>
import * as libsimba from '@simbachain/libsimba-js'
import { ModelStl } from 'vue-3d-model'
import LFU from 'node-lfu-cache'

  export default {
    components: {
      ModelStl
    },
    watch: {
      stlFile: {
        handler(){
          this.getBase64()
        }
      },
      dialog: {
        handler(){
          if(!this.dialog) {
            this.resetForm()
          }
        }
      }
    },
    data: () => ({
      stlFile: null,
      backgroundAlpha: 0,
      model: null,
      overlay: true,
      loadParts: false,
      polling: null,
      snapshot: null,
      base64: null,
      fullscreen: false,
      fullscreenGraph: false,
      controllable: false,
      snackbar: false,
      text: '',
      loading: false,
      rules: [
        v => !!v || 'Field is required',
      ],
      dialog: false,
      show: false,
      name: '',
      wallet: null,
      address: null,
      seed: null,
      walletProgress: 0,
      walletStatus: 'Checking ',
      simba: null,
      postingTxn: false,
      valid: false,
      cache: null,
      items: [],
      preview: [],
    }),
    mounted () {
      this.initInstance()
      this.initCache()
    },
    beforeDestroy () {
      clearInterval(this.polling)
    },
    created () {
      this.pollData()
    },
    methods: {
      pollData () {
        this.polling = setInterval(() => {
          this.getTxns()
        }, 8000)
      },

      initCache() {
        let self = this
        this.cache = new LFU({
          max: 5, dispose: function(key) {
            self.preview.forEach(function(item) {
              if (item.bundleHash === key) {
                item.show3d = false
              }
            })    
          }
        })
      },

      initInstance() {
        ;(async () => {
          let simba = await libsimba.getSimbaInstance(
            'yourApiUrl',
            null,
            'yourApiKey');
          this.simba = simba
          this.initWallet(simba)
          this.getTxns()
        })();
      },

      initWallet(simba) {
        let wallet = new libsimba.LocalWallet(
          () => { return Promise.resolve(true) }
        );
        this.wallet = wallet

        if (wallet.walletExists()) {
          this.walletStatus = 'Unlocking '
          let lastProgress = 0;

          (async () => {
            await wallet.unlockWallet(
              'password',
              (progress) => {
                if (Math.floor(progress * 10) > lastProgress) {
                  lastProgress = progress * 10;
                  this.walletProgress = Math.floor(progress*100)
                }
              }
            );
            this.simba.setWallet(this.wallet)
            this.address = await wallet.getAddress();
            this.seed = await wallet.getMnemonic();
          })();
          return
        } 

        this.walletStatus = 'Creating '
        let lastProgress = 0;

        (async () => {
          await wallet.generateWallet(
            'password',
            (progress) => {
              if (Math.floor(progress * 10) > lastProgress) {
                lastProgress = progress * 10;
                this.walletProgress = Math.floor(progress*100)
              }
            });
          this.simba.setWallet(this.wallet)
          this.address = await wallet.getAddress();
          this.seed = await wallet.getMnemonic();
        })();
      },

      getTxns() {
        if (!this.simba) {
          return
        }
        ;(async () => {
          let response = await this.simba.getTransactions({})
            .then(async (ret) => {
              return ret.data()
            })
            .catch((error) => {
              //console.log(error)
            });

          this.items = response
          this.overlay = false
          this.loadParts = false
          this.initPreview()
        })();
      },

      initPreview() {
        let self = this
        this.items.forEach(function(item) {
          if (!self.preview.find(x => x.txnId === item.id)) {
            self.preview.push(
              {txnId: item.id, 
                bundleHash: item.payload.inputs._bundleHash, 
                src: 'https://source.unsplash.com/p1m4B-lhS9Y/1600x900',
                loading: true,
                show3d: false
              })
            self.getSnapshot(item.id)
          }
        });
      },

      getSnapshot(txnId) {
        ;(async () => {
          await this.simba.getFileFromBundleForTransaction(txnId, 1, false)
            .then(async (blob) => {
              let self = this
              let reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onload = function () {
                self.preview.find(x => x.txnId === txnId).src = reader.result
              };
            })
            .catch((error) => {
              //console.log(error)
            })
            .finally(() => {
              this.setLoading(txnId, false)
            })
        })();
      },

      takeSnapshot() {
        let self = this
        this.base64 = this.$refs.model.renderer.domElement.toDataURL('image/png');
        this.urltoFile(this.base64, 'snapshot.png')
          .then(function(file){
            self.constructData(file)
          })
      },

      urltoFile(url, filename, mimeType){
        mimeType = mimeType || (url.match(/^data:([^;]+);/)||'')[1];
        return (fetch(url)
          .then(function(res){return res.arrayBuffer();})
          .then(function(buf){return new File([buf], filename, {type:mimeType});})
        );
      },

      constructData(file) {
        let methodParams = { name: this.name }
        let files = [this.stlFile, file]
        this.postTxn(methodParams, files)
      },

      postTxn(methodParams, files) {
        this.postingTxn = true

        ;(async () => {
          await this.simba.callMethodWithFile('registerPart', methodParams, files)
            .then(async (ret) => {
              this.dialog = false
            })
            .catch((error) => {
              //console.log(error)
            })
            .finally(() => {
              this.postingTxn = false
            })
        })();
      },

      lookupFile(txnId, bundleHash) {
        console.log(this.cache)
        if (this.cache.has(bundleHash)) {
          this.cache.get(bundleHash)
          this.setupPreview(txnId)
          return 
        }
        this.getFileMeta(txnId, bundleHash)
      },

      getFileMeta(txnId, bundleHash) {
        this.setLoading(txnId, true)
        this.loading = true
        ;(async () => {
          await this.simba.getBundleMetadataForTransaction(txnId)
            .then(async (res) => {  
              if (res.manifest[0].size <= 10000000) {
                this.getFile(txnId, bundleHash, false)
              } else {
                this.setLoading(txnId, false)
                this.loading = false
                this.snackbar = true
                this.text = 'File is too large to preview, please download instead'
              }
            })
            .catch((error) => {
              //console.log(error);
            })
        })();
      },

      getFile(txnId, bundleHash, download) {
        this.setLoading(txnId, true)
        ;(async () => {
          await this.simba.getFileFromBundleForTransaction(txnId, 0, false)
            .then(async (blob) => {  
              if (download) {
                let a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";

                let url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = 'file.stl';
                a.click();
                window.URL.revokeObjectURL(url);
              } else {
                let reader = new FileReader();
                reader.readAsDataURL(blob);
                let self = this
                reader.onload = function () {
                  self.cache.set(bundleHash, reader.result)
                  self.setupPreview(txnId)
                };
              }
            })
            .catch((error) => {
              //console.log(error);
            })
            .finally(() => {
              this.setLoading(txnId, false)
              this.loading = false
            })
        })();
      },

      setLoading(txnId, value) {
        this.preview.find(x => x.txnId === txnId).loading = value
      },

      setupPreview(txnId) {
        this.preview.find(x => x.txnId === txnId).show3d = true
      },

      getBase64() {
         if (!this.stlFile) {
          this.snapshot = null
          return
         }
         let reader = new FileReader();
         reader.readAsDataURL(this.stlFile);
         let self = this
         reader.onload = function () {
           let snapshot = reader.result
           self.snapshot = snapshot
         };
         // reader.onerror = function (error) {
         //   console.log('Error: ', error);
         // };
      },

      resetForm () {
        this.$refs.form.reset()
      },
      openFullscreen(bundleHash) {
        this.fullscreenGraph = this.cache.peek(bundleHash)
        this.fullscreen = true
      },

    }
  }
</script>

<style>
.ellipsis {
  width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
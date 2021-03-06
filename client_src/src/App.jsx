import React, {
  Component
} from 'react'
import Axios from 'axios'
import {
  NotificationContainer,
  NotificationManager
} from 'react-light-notifications'

import Box from './components/Box'
import Header from './components/Header'
import Buttons from './components/Buttons'
import {
  GETLINKS_API,
  CHECKLINKS_API,
  UPLOAD_API
} from './constants'

import './App.css'
import 'react-light-notifications/lib/main.css'

class app extends Component {
  constructor (props) {
    super(props)
    this.state = {
      inputUrl: '',
      files: [],
      links: [],
      linksCheck: [],
      dropzoneActive: false,
      loading: false,
      loaded: false,
      hasError: false,
      error: '',
      activePage: 1,
      pageItemCount: 10,
      statusLoading: false
    }
    this.onDrop = this.onDrop.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.validLink = this.validLink.bind(this)
    this.getLinks = this.getLinks.bind(this)
    this.uploadSingleFile = this.uploadSingleFile.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleUploadNew = this.handleUploadNew.bind(this)
    this.checkLinks = this.checkLinks.bind(this)
    this.notifyError = this.notifyError.bind(this)
    this.handlePageChange = this.handlePageChange.bind(this)
    this.dropRejected = this.dropRejected.bind(this)
  }

  handleInputChange (event) {
    const target = event.target
    const value = target.value
    const name = target.name
    this.setState({
      [name]: value
    })
  }

  handlePageChange (pageNumber) {
    this.setState({
      activePage: pageNumber
    })
  }

  handleKeyPress (event) {
    if (event.key === 'Enter') {
      this.validLink()
    }
  }

  handleUploadNew () {
    this.setState({
      links: [],
      loaded: false,
      activePage: 1
    })
  }

  onDrop (files) {
    this.setState({
      files,
      dropzoneActive: false,
      loading: true
    },
    this.uploadSingleFile
    )
  }

  dropRejected () {
    NotificationManager.error({
      message: 'Document should be of PDF format/type.'
    })
  }

  validLink () {
    let data = {...this.state}
    let url = data.inputUrl
    /* https://www.regextester.com/94502 */
    let matchUrl = url.match(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/g)

    /* https://stackoverflow.com/questions/3543187/
    prepending-http-to-a-url-that-doesnt-already-contain-http */
    if (matchUrl == null || matchUrl.length < 1) {
      NotificationManager.error({
        message: 'Please enter a valid url.'
      })
    } else {
      if (!url.match(/^[a-zA-Z]+:\/\//)) {
        url = 'http://' + url
      }
      this.setState({
        inputUrl: url
      }, this.getLinks)
    }
  }

  getLinks () {
    if (this.state.loading === false) {
      this.setState({
        loading: true
      })
    }
    Axios.get(GETLINKS_API, {
      params: {
        url: this.state.inputUrl
      }
    }).then(response => {
      let res = {
        linksCheck: []
      }
      response.data.links.forEach(link => {
        res['linksCheck'].push({'link': link, status: '-'})
      })
      this.setState({
        links: response.data.links,
        loading: false,
        loaded: true,
        linksCheck: res.linksCheck,
        inputUrl: ''
      }, this.clearSearch())
    }).catch(error => {
      this.setState({
        hasError: true,
        error: error.response.data,
        loading: false,
        loaded: false
      })
      let err = error.response.data.error
      NotificationManager.error({
        message: err.message
      })
    })
  }

  uploadSingleFile () {
    let bodyFormData = new FormData()
    bodyFormData.set('file', this.state.files[0])
    Axios({
      method: 'post',
      url: UPLOAD_API,
      params: {},
      data: bodyFormData
    }).then(response => {
      let file = response.data.result.files.file[0]
      this.setState({
        inputUrl: file.name
      },
      this.getLinks
      // this.clearSearch()
      )
    }).catch(error => {
      this.setState({
        hasError: true,
        error: error.response,
        loading: false
      }
      // this.clearSearch()
      )
    })
  }

  checkLinks () {
    this.setState({
      statusLoading: true
    })
    if (this.state.loaded && this.state.links.length > 0) {
      var formObj = {
        'links': this.state.links
      }
      const data = new FormData()
      data.append('links', formObj)
      Axios({
        method: 'post',
        url: CHECKLINKS_API,
        data: formObj
      }).then(response => {
        this.setState({
          linksCheck: response.data.links,
          statusLoading: false
        })
      }).catch(error => {
        this.setState({
          hasError: true,
          error: error.response.data.error,
          loading: false,
          statusLoading: false
        })
      })
    } else {
      NotificationManager.error({
        message: 'No links to check.'
      })
    }
  }

  notifyError () {
    NotificationManager.error({
      title: 'Error Title',
      message: 'Error Message'
    })
  }

  clearSearch () {
    let s = document.getElementById('search-form')
    s.value = ''
  }

  componentDidMount () {
    this.nameInput.focus()
  }

  render () {
    return (
      <div className='app'>
        <Header />
        <div className='container'>
          <div className='row justify-content-md-center'>
            <div className='col-md-8'>
              <div className='card card--searchbar'>
                <div className='row no-gutters'>
                  <div className='col-11 col-sm-11 col-xs-11'>
                    {/* <form id='search-form'> */}
                    <input
                      type='text'
                      className='card__input'
                      name='inputUrl'
                      id='search-form'
                      onChange={this.handleInputChange}
                      placeholder='http://www.example.com/file.pdf'
                      onKeyPress={this.handleKeyPress}
                      ref={(input) => { this.nameInput = input }} />
                    {/* </form> */}
                  </div>
                  <div className='col-1 col-sm-1 col-xs-1'>
                    <div className='card__options'>
                      <i
                        className='material-icons
                        card__searchbutton
                        card--buttoncolor'
                        onClick={this.validLink}>
                        search
                      </i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='row justify-content-md-center'>
            <div className='col-12'>
              {(this.state.loaded)
                ? (<p className='app__placehold'>Extracted Links</p>)
                : (<p className='app__placehold'>or</p>)}
            </div>
            <div className='col-md-8'>
              <Box
                {...this.state}
                dropped={this.onDrop}
                dropRejected={this.dropRejected}
                pageChanged={this.handlePageChange} />
            </div>
            <NotificationContainer />
            <div className='col-md-8'>
              <Buttons
                loaded={this.state.loaded}
                uploadNewClicked={this.handleUploadNew}
                checkLinksClicked={this.checkLinks} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default app

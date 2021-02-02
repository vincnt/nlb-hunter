import React, { useState, useEffect } from 'react'
import firebase from '@firebase/app';
import {Grid, GridList, GridListTile, Button, 
  TextField, Card, CardContent, Typography, CardActionArea, makeStyles, CardActions} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert';

import CircularProgress from '@material-ui/core/CircularProgress';

import './App.css';
require('firebase/functions')

const useStyles = makeStyles({
  root: {
    // display: 'flex',
    // flexWrap: 'wrap',
    // justifyContent: 'space-around',
    // overflow: 'hidden',
  },
  title: {
    fontSize: 8,
  },
  pos: {
    marginBottom: 4,
  },
  gridList: {
    flexWrap: 'nowrap',
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: 'translateZ(0)',
    padding: '10px',
    height: '100%'
  },
  
  card: {
    // height: "100%",
    // marginBottom: "15px", // or margin: "2px" so at least all sides are covered
    // paddingBottom: "10px",
    // minHeight: '100vh'
  },

  gridTile: {
    position: 'relative',
    float: 'left',
    width: '100%',
    padding: '10px',
    overflow: 'hidden',
    height: '100% !important'
  }
});

export function Nlb() {
    const classes = useStyles();

    const [readingListInput, setReadingListInput] = useState('')
    const [readingList, setReadingList] = useState([])
    const [loadingReadingList, setLoadingReadingList] = useState(false)
    const [loadingAvailability, setLoadingAvailability] = useState(false)

    const [availableBooks, setAvailableBooks] = useState({})
    const [displayLocationBooks, setDisplayLocationBooks] = useState([])
    const [selectedLocation, setSelectedLocation] = useState()
    const [readingListAlert, setReadingListAlert] = useState('')
    const [readingListExport, setReadingListExport] = useState('')

    const getTitleDetails = firebase.functions().httpsCallable('getTitleDetails')
    const getAvailability = firebase.functions().httpsCallable('availability');
  
    async function getAllAvailable(bid){
      const results = await getAvailability({bid})
      const availableBooks = results.data.results.filter((item)=>item.StatusDesc==='Not on Loan');
      return availableBooks
    }

    function handleReadingListInputChange(input){
      setReadingListInput(input.target.value)
    }

    async function addToReadingList(){
      if (readingListInput){
        setLoadingReadingList(true)
        const splitInput = readingListInput.split(" ")
        await Promise.all(splitInput.map(async (isbn)=>{
          const bookDetails = await getTitleDetails({ISBN: isbn})
          if (bookDetails.data.results){
            setReadingListAlert('')
            return setReadingList(prev => [...prev, {userIsbn: isbn, ...bookDetails.data.results}])
          } else{
            return setReadingListAlert('Invalid ISBN')
          }
        }))
        setLoadingReadingList(false)
        setReadingListInput('')
      }
    }

    function removeReadingListCard(book){
      setReadingList(prev => prev.filter((b)=>b!==book))
    };

    function ReadingListCard({book}){
      return (
      <Card variant="outlined" className={classes.card}>
        <CardContent>
          <Typography variant="body1" fontWeight="fontWeightBold" component="h5">
          { book.TitleName.slice(0,100) + (book.TitleName.length > 100? '...':'')}
          </Typography>
          <Typography className={classes.pos} color="textSecondary">
            {book.Author}
          </Typography>
          <Typography variant="body2" component="p">
            {book.PhysicalDesc}
          </Typography>
          <Typography variant="body2" component="p">
            <br/>
            ISBNs: {book.ISBN}
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={()=>removeReadingListCard(book)}>Remove from list</Button>
        </CardActions>
      </Card>)
    }

    function exportReadingList(){
      setReadingListExport(readingList.map(i=>i.userIsbn).join(' '))
    }


    
    function DisplayBookCard({book}){
      const bookData = book.bookData
      const availability = book.availability.filter((loc)=>loc.BranchName===selectedLocation)[0]
      return (
        <Card variant="outlined" align-content="flex-end">
                    <CardActionArea>
                      <CardContent>
                      <Typography variant="body1" fontWeight="fontWeightBold" component="h5">
          { String(bookData.TitleName)}
          </Typography>
          <Typography className={classes.pos} color="textSecondary">
            {bookData.Author}
          </Typography>
          <Typography variant="body2" component="p">
            {bookData.PhysicalDesc}
          </Typography>
          <Typography variant="body2" component="p">
            Call Number: {availability.CallNumber}
          </Typography>
          <Typography variant="body2" component="p">
            LocationDesc: {availability.LocationDesc}
          </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>)
                  
    }

    async function updateAvailability(){
      if (readingList && readingList.length > 0){
        setLoadingAvailability(true)
        await Promise.all(readingList.map(async (book) => {
          const bookBid = book.BID
          const availableBooks = await getAllAvailable(bookBid)
          return setAvailableBooks(prev => {
            return {...prev, [bookBid]: {bookData: book, availability: availableBooks} }
          })
        }))
        setLoadingAvailability(false)
      }
    }

    const [locationAvailableData, setLocationAvailableData ] = useState({})

    // sort available books
    useEffect(()=>{
      if(Object.keys(availableBooks).length > 0){
        const data = {}
        Object.keys(availableBooks).forEach((bookBid)=>{
          availableBooks[bookBid].availability.forEach((locationData)=>{
            const branchName = locationData.BranchName
            data[branchName] = data[branchName] || []
            data[branchName].push(availableBooks[bookBid])
          })
        })
        setLocationAvailableData(data)
      }
    }, [availableBooks])

    function handleCardLocationClick(location){
      setSelectedLocation(location)
      setDisplayLocationBooks(locationAvailableData[location])
    }
  
    return (
      <div className="App classes.root">
        <header className="App-header">
          NLB Hunter
        </header>

        <Grid container spacing={5}>
          <Grid item xs={12}>
          Example ISBNs: 0761386424 9781338656060

              <Grid item xs={3}>
                <h3>Reading List</h3>
              </Grid>
              ISBN(s):
              <TextField onChange={handleReadingListInputChange} value={readingListInput}></TextField>
              <Button variant="outlined" style={{marginLeft:'10px'}} color="primary" onClick={addToReadingList}> Add </Button>
              <>{loadingReadingList ? <CircularProgress color="inherit" size={20} /> : null}</>
              <p style={{fontSize:'8px'}}>Accepts space seperated list of ISBNs</p>
              {readingListAlert.length>0 && <Alert severity="warning">{readingListAlert}</Alert>}
              {readingList.length>0 && <Button variant="outlined" onClick={()=>exportReadingList()}>Export Reading List</Button>}
              {readingListExport.length>0 && <p>{readingListExport}</p>}
              <GridList cols={4.5} className={classes.gridList}>
                {
                  readingList.map((book,i)=>
                    <GridListTile key={i} className={classes.gridTile}>
                      <ReadingListCard book={book} key ={i}/>
                    </GridListTile>
                  )
                }
                
              </GridList>
            </Grid>

            {readingList.length>0 && 
            <><Grid item xs={12}>
              <Button variant="contained" color="primary" component="h2" onClick={updateAvailability}>Get Availability</Button>
              <>{loadingAvailability ? <CircularProgress color="inherit" size={20} /> : null}</>
            </Grid>

            <Grid item xs={4}>
              {Object.keys(locationAvailableData).map((location, j)=>{
                return (
                  <Card variant="outlined" align-content="flex-end" key={j}>
                    <CardActionArea onClick={()=>handleCardLocationClick(location)}>
                      <CardContent>
                        <Typography color="textPrimary" component="h3">
                          {location} ({locationAvailableData[location].length})
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>)
              })}
            </Grid>

            <Grid item xs={8}>
              {displayLocationBooks.map((book, j)=>{
                return (
                  <DisplayBookCard book={book} key={j}/>)
              })}
            </Grid>
            </>}

        </Grid>


      </div>

    );
  }
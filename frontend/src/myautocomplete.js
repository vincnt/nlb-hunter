import React, { useState, useEffect } from 'react'
import firebase from '@firebase/app';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import _ from 'lodash';

import './App.css';
require('firebase/functions')

export function MyAutocomplete(props) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [prevInputValue, setPrevInputValue] = useState('')
    // const [value, setValue] = useState(null); // the selected book
    const [loading, setLoading] = useState(open)
    const setValue = props.setValue

    const nlbSearch = firebase.functions().httpsCallable('search');

    const nlbSearchThrottled = React.useMemo(()=>_.throttle(nlbSearch,2000),[nlbSearch]);

    const search = React.useCallback(async () => {
      console.log('search input vaule', inputValue)
      const results = await nlbSearchThrottled({searchType:'Title', searchValue:inputValue});
      if (results){
        return results.data.results
      }
    },[inputValue, nlbSearchThrottled])

    useEffect(() => {
        console.log('input value changed', inputValue)
        console.log('loading', loading)

        let active = true;
    
        if (inputValue.length < 5){
            // setOptions(value ? [value] : []) // this causes a max depth size exceeded for some reason
            return undefined
        }
        
        if (inputValue !== prevInputValue){
          (async () => {
            setLoading(true);

            console.log('searching...')
            const response = await search();
            if (active) {
              setOptions(response);
              setPrevInputValue(inputValue)
              setLoading(false);
            }
          })();
        }
    
        return () => {
          active = false;
        };
      }, [loading, nlbSearchThrottled, inputValue, prevInputValue, search]);

    // not sure what this does but was in the example code so leaving in in case i need it in the future
    // useEffect(() => {
    //     if (!open) {
    //       setOptions([]);
    //     }

    //   }, [open]);

    return (
        <>
        <span>Need to type 5 characters or more to begin search.</span>
        <Autocomplete
          id="asynchronous-demo"
          style={{}}
          open={open}
          onOpen={() => {
            setOpen(true);
          }}
          onClose={() => {
            setOpen(false);
          }}
          getOptionSelected={(option, value) => option.TitleName === value.TitleName}
          getOptionLabel={(option) => `${option.Author} - ${option.TitleName}`}
          // filterOptions={(x) => x}
          includeInputInList
          options={options}
          loading={loading}
          onChange={(event, newValue) => {
            setOptions(newValue ? [newValue, ...options] : options);
            setValue(newValue);
          }}
          onInputChange={(event, newInputValue) => {
            _.debounce((newInputValue)=>setInputValue(newInputValue), 2000)(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Title"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
        />
        </>
    );
  }
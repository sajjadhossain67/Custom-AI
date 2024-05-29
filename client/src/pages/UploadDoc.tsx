import React, { useCallback, useState } from 'react';
import { axiosOpen, axiosSecure } from '../services/api/axios';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Container, TextField } from '@mui/material';

const UploadDoc = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<any>();
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const onDrop = useCallback((acceptedFiles: any) => {
    // Do something with the files
    setFile(acceptedFiles);
    console.log(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.pdf'],
    },
  });

  const handleSubmit = async () => {
    if (file.length <= 0) return;
    const formData: any = new FormData();
    let isMultiplePdfs = file.length > 1 ? true : false;
    let apiUrl = `/uploadPdf`;

    if (isMultiplePdfs) {
      apiUrl = `upload-multiple-pdfs`;
      file.map((singleFile: any, index: any) => {
        formData.append('files', singleFile);
      });
    } else {
      formData.append('file', file[0]);
    }

    setLoading(true);
    try {
      for (const entry of formData.entries()) {
        console.log(entry[0], entry[1]);
      }
      const response = await axiosSecure.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'multipart/form-data',
        },
      });
      if (response.status === 201) {
        setLoading(false);
        window.alert('doc uploaded');
        if (isMultiplePdfs) {
          setUploadedFileName(response.data.filename);
        } else {
          setUploadedFileName(response.data.fileName);
        }
        // navigate('/chat');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatbot = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      botName: data.get('botName'),
      fileName: uploadedFileName,
    };
    console.log(payload);

    try {
      setIsCreatingBot(true);
      const response = await axiosSecure.post('/chatbots', payload);
      console.log(response.data);
      if (response.data) {
        window.alert(response.data.successMessage);
        setUploadedFileName(null);
        setFile([]);
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreatingBot(false);
    }
  };

  return (
    <>
      <Box>
        {loading ? (
          <p>uploading doc......</p>
        ) : (
          <section className="container">
            <Box
              sx={{
                backgroundColor: '#FaFbFE',
                height: '150px',
                width: '600px',
                margin: '0 auto',
                borderRadius: '12px',
                padding: '5px',
              }}
              {...getRootProps({ className: 'dropzone' })}
            >
              <Box
                sx={{
                  backgroundColor: 'white',
                  border: '1px dashed rgb(99, 102, 241)',
                  height: '100%',
                  width: '100%',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  padding: '20px 0',
                  ':hover': {
                    background: 'rgb(99, 102, 241)',
                    color: '#fff',
                  },
                }}
              >
                <input {...getInputProps()} />
                <h3>Drag 'n' drop some files here, or click to select files</h3>
              </Box>
            </Box>
            <Box sx={{ margin: '15px 0' }}>
              {file && (
                <ul>
                  {file.map((singleFile: any) => (
                    <li>{singleFile.path}</li>
                  ))}
                </ul>
              )}
            </Box>
          </section>
        )}
        <button
          style={{ marginRight: '4px' }}
          disabled={uploadedFileName ? true : false}
          className="custom-button"
          onClick={handleSubmit}
        >
          Upload Docs
        </button>
        <button
          disabled={!file || file?.length === 0 ? true : false}
          className="custom-button"
          onClick={() => {
            setFile([]);
            setUploadedFileName(null);
          }}
        >
          Clear Docs
        </button>
      </Box>
      <Container maxWidth="md" sx={{ marginTop: 5 }}>
        <Box
          component="form"
          onSubmit={handleCreateChatbot}
          noValidate
          sx={{ mt: 1 }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="botName"
            label="Select a name for your bot..."
            name="botName"
            autoComplete="botName"
            autoFocus
          />
          <Button
            disabled={uploadedFileName === null || isCreatingBot ? true : false}
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {isCreatingBot ? 'Creating Bot...' : 'Create Bot'}
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default UploadDoc;

import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
} from "@mui/material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const registerSchema = Yup.object({
  username: Yup.string()
    .min(3, "Min 3 chars")
    .max(30, "Max 30 chars")
    .required("Username required"),
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string().min(6, "Min 6 chars").required("Password required"),
});

const Register = () => {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      try {
        const res = await axios.post(
          "http://localhost:5000/api/auth/register",
          values,
        );
        login(res.data.user, res.data.token);
        navigate("/");
      } catch (err) {
        formik.setFieldError(
          "general",
          err.response?.data?.error || "Registration failed",
        );
      }
    },
  });

  if (authLoading) return <div>Loading...</div>;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Join SecureChat
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            paragraph
          >
            Create account for private, encrypted chats
          </Typography>
          {formik.errors.general && (
            <Alert severity="error">{formik.errors.general}</Alert>
          )}
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Creating..." : "Sign Up"}
            </Button>
            <Stack direction="row" justifyContent="space-between">
              <Link to="/login" variant="body2">
                {"Have account? Sign In"}
              </Link>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;

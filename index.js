import {} from "dotenv/config";
import express from "express";
import cors from "cors";
import Note from "./models/note.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("build"));

app.get("/", (request, response) => {
	response.send("<h1>Hello World!</h1>");
});

app.get("/api/notes", (request, response) => {
	Note.find({}).then(notes => {
		response.json(notes);
	});
});

//GET - get individual note with error handlers
app.get("/api/notes/:id", (request, response, next) => {
	Note.findById(request.params.id)
		.then(note => {
			if (note) {
				response.json(note);
			} else {
				response.status(404).end();
			}
		})
		.catch(error => next(error));
});

//DELETE request - removes individual note
app.delete("/api/notes/:id", (request, response, next) => {
	Note.findByIdAndRemove(request.params.id)
		.then(() => {
			response.status(204).end();
		})
		.catch(error => next(error));
});

//PUT request - changes importance of the note
app.put("/api/notes/:id", (request, response, next) => {
	const { content, important } = request.body;

	Note.findByIdAndUpdate(
		request.params.id,
		{ content, important },
		{ new: true, runValidators: true, context: "query" }
	)
		.then(updatedNote => {
			response.json(updatedNote);
		})
		.catch(error => next(error));
});

//POST request - add a new note to DB
app.post("/api/notes", (request, response, next) => {
	const body = request.body;

	if (body.content === undefined) {
		return response.status(400).json({ error: "content missing" });
	}

	const note = new Note({
		content: body.content,
		important: body.important || false,
	});

	note.save()
		.then(savedNote => {
			response.json(savedNote);
		})
		.catch(error => next(error));
});

const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: "unknown endpoint" });
};

// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
	console.error(error.message);
	if (error.name === "CastError") {
		return response.status(400).send({ error: "malformatted id" });
	} else if (error.name === "ValidationError") {
		return response.status(400).json({ error: error.message });
	}
	next(error);
};

//handler of requests with result to errors -
//this has to be the last loaded middleware.
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
"""Chatbot: turns a free-text request (RO/EN) into search filters. It never touches bookings
and the language model never gets database access: it only returns JSON, which we validate."""

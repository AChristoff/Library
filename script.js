function attachEvents() {
    const spinner = $('#spinner');
    const baseUrl = 'https://baas.kinvey.com/appdata';
    const appKey = 'kid_Hy3FsSGF4';
    const collection = 'books';
    const username = 'guest';
    const password = 'guest';
    const headers = {
        'Authorization': `Basic ${btoa(username + ':' + password)}`,
        'Content-Type': 'application/json'
    };

    let addBtn = $('#addButton').on('click', addBook);
    let showHideBtn = $('#showButton').on('click', showHideBooks);
    $('#commitBook').on('click', commitBook);
    $('#cancelAdd').on('click', cancelAdd);

    let add = $('#input');
    let list = $('#book-list');
    let title = $('#add-title');
    let author = $('#add-author');
    let isbn = $('#add-number');

    async function addBook() {

        if (!add.is(':visible')) {
            add.show();
            addBtn.attr('class', 'adding');
        } else {
            add.hide();
            addBtn.attr('class', 'button');
            resetTitle(true);
            resetAuthor(true);
        }
    }

    async function commitBook() {
        spinner.show();

        if (title.val() && author.val()) {
            let newBook;

            if (isbn.val()) {
                newBook = {
                    title: title.val(),
                    author: author.val(),
                    isbn: isbn.val(),
                };
            } else {
                newBook = {
                    title: title.val(),
                    author: author.val(),
                    isbn: 'N/A',
                };
            }

            try {
                await $.ajax({
                    headers,
                    url: baseUrl + '/' + appKey + '/' + collection,
                    method: 'POST',
                    data: JSON.stringify(newBook),
                });
                showBooks();

                title
                    .val('')
                    .attr('placeholder', '  enter Title *');
                author
                    .val('')
                    .attr('placeholder', '  enter Author *');
                isbn.val('');

            } catch (err) {
                console.log(err);
                spinner.hide();
            }
        } else {
            if (!title.val()) {
                title
                    .attr('placeholder', '  Title is required *')
                    .css('border', 'solid #DC143C 2px');
                title.on('keypress', () => resetTitle())
            }
            if (!author.val()) {
                author
                    .attr('placeholder', '  Author is required *')
                    .css('border', 'solid #DC143C 2px');

                author.on('keypress', () => resetAuthor())
            }

            spinner.hide();
        }


    }

    async function showBooks() {
        spinner.show();
        try {

            let bookList = await $.ajax({
                headers,
                url: baseUrl + '/' + appKey + '/' + collection,
                method: 'GET',
            });

            list.empty();
            let tableHeader = $(`<th>Title</th>
                                 <th>Author</th>
                                 <th>ISBN</th>
                                 <th></th>
                                 <th></th>`);
            tableHeader.appendTo(list);
            bookList.forEach((book) => {
                let p = $(`<tr id="${book._id}">)
                               <td>${book.title}</td>
                               <td>${book.author}</td>
                               <td>${book.isbn}</td>
                               <td><button id="edit" class="edit">Edit</button></td>
                               <td><button id="delete" class="edit">Delete</button></td>
                           </tr>`);

                let editBtn = p.find('#edit');
                editBtn.on('click', (e) => {

                    if (editBtn.text() === 'Edit') {
                        let row = e.target.parentNode.parentNode;
                        let [firstRow, , secondRow, , thirdRow, , edit, , del] = $(row.childNodes).toArray();
                        $(firstRow).empty();
                        $(secondRow).empty();
                        $(thirdRow).empty();
                        let titleInput = $(`<input id="edit-title" placeholder='edit: ${book.title}'>`);
                        let authorInput = $(`<input id="edit-author" placeholder='edit: ${book.author}'>`);
                        let isbnInput = $(`<input id="edit-number" placeholder='edit: ${book.isbn}'>`);
                        $(firstRow).append(titleInput);
                        $(secondRow).append(authorInput);
                        $(thirdRow).append(isbnInput);
                        $(edit).children().attr('class', 'editing').text('Cancel');
                        let commitBtn = $(del).empty();
                        commitBtn.append('<button id="commit" class="edit">Commit</button>');
                        commitBtn.children().on('click', commitChanges);
                    } else {
                        let row = e.target.parentNode.parentNode;
                        let [firstRow, , secondRow, , thirdRow, , edit, , del] = $(row.childNodes).toArray();
                        $(firstRow).empty().text(`${book.title}`);
                        $(secondRow).empty().text(`${book.author}`);
                        $(thirdRow).empty().text(`${book.isbn}`);
                        $(edit).children().attr('class', 'edit').text('Edit');
                        let commitBtn = $(del).empty();
                        commitBtn.append('<button id="delete" class="edit">Delete</button>');
                        commitBtn.children().on('click', deleteBook);
                    }
                });

                p.find('#delete').on('click', deleteBook);
                p.appendTo(list);
            });
            showHideBtn.text('Hide Books');
            list.show();
            spinner.hide();
        } catch (err) {
            console.log(err);
            spinner.hide();
        }
    }

    async function commitChanges() {
        spinner.show();
        let id = $(this).parent().parent().toArray()[0].id;

        try {

            let book = await $.ajax({
                headers,
                url: baseUrl + '/' + appKey + '/' + collection + '/' + id,
                method: 'GET',
            });

            let titleCell = $(this).parent().parent().children().toArray()[0];
            let authorCell = $(this).parent().parent().children().toArray()[1];
            let isbnCell = $(this).parent().parent().children().toArray()[2];
            titleCell = $(titleCell.firstChild).val();
            authorCell = $(authorCell.firstChild).val();
            isbnCell = $(isbnCell.firstChild).val();

            let editBook = {
                title: titleCell || book.title,
                author: authorCell || book.author,
                isbn: isbnCell || book.isbn,
            };

            await $.ajax({
                headers,
                url: baseUrl + '/' + appKey + '/' + collection + '/' + id,
                method: 'PUT',
                data: JSON.stringify(editBook),
            });
            showBooks();

        } catch (err) {
            console.log(err);
            spinner.hide();
        }
    }

    async function deleteBook() {
        spinner.show();
        let id = $(this).parent().parent().toArray()[0].id;
        try {
            await $.ajax({
                headers,
                url: baseUrl + '/' + appKey + '/' + collection + '/' + id,
                method: 'DELETE'
            });
        } catch (err) {
            console.log(err);
            spinner.hide()
        }
        showBooks();
    }

    function cancelAdd() {
        add.hide();
        addBtn.attr('class', 'button');
        resetTitle(true);
        resetAuthor(true);
    }

    function showHideBooks() {

        if (!list.is(':visible')) {
            showHideBtn
                .attr('class', 'hide');

            showBooks();

        } else {
            list.hide();
            showHideBtn
                .attr('class', 'button')
                .text('Show Books');
        }


    }

    function resetTitle(fullReset) {
        if (fullReset) {
            title
                .val('')
                .attr('placeholder', '  enter Title *')
                .css('border', 'inset #EBE9ED 2px ');
        } else {
            title
                .attr('placeholder', '  enter Title *')
                .css('border', 'inset #EBE9ED 2px ');
        }
    }

    function resetAuthor(fullReset) {
        if (fullReset) {
            author
                .val('')
                .attr('placeholder', '  enter Author *')
                .css('border', 'inset #EBE9ED 2px ');
        } else {
            author
                .attr('placeholder', '  enter Author *')
                .css('border', 'inset #EBE9ED 2px ');
        }

    }
}